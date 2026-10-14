"use server";

import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users, sessions, passwordResetTokens, categories, attachments, userPreferences } from "@/db/schema";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  newToken,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import {
  signUpSchema,
  signInSchema,
  requestResetSchema,
  resetPasswordSchema,
  profileSchema,
  changePasswordSchema,
} from "@/lib/validation";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { isSafeNext } from "@/lib/utils";
import { deleteFiles } from "@/lib/storage";

export interface AuthState {
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  resetUrl?: string;
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/* ------------------------------- cadastro ------------------------------ */

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const email = parsed.data.email.toLowerCase();

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return { fieldErrors: { email: "Já existe uma conta com este e-mail." } };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const [created] = await db
    .insert(users)
    .values({ name: parsed.data.name, email, passwordHash })
    .returning({ id: users.id });

  await db.insert(userPreferences).values({ userId: created.id });
  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((c, i) => ({ ...c, userId: created.id, sortOrder: i })),
  );

  await createSession(created.id);
  redirect("/inicio?bem-vindo=1");
}

/* -------------------------------- login -------------------------------- */

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const email = parsed.data.email.toLowerCase();

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "E-mail ou senha incorretos. Verifique e tente novamente." };
  }

  await createSession(user.id);
  redirect(isSafeNext((formData.get("next") as string) ?? null));
}

/* -------------------------------- logout ------------------------------- */

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/");
}

/* --------------------------- recuperar senha --------------------------- */

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = requestResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const email = parsed.data.email.toLowerCase();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!rows[0]) {
    // Não revela se o e-mail existe ou não.
    return { message: "Se este e-mail estiver cadastrado, você receberá as instruções de recuperação." };
  }

  const token = newToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await db.insert(passwordResetTokens).values({ userId: rows[0].id, token, expiresAt });

  // Nenhum serviço de e-mail está configurado neste ambiente. O link é exibido
  // na tela para que o fluxo funcione; em produção, conecte um provedor de
  // e-mail e envie este link em vez de exibi-lo.
  return {
    message:
      "Link de recuperação gerado (válido por 1 hora). Nenhum serviço de e-mail está configurado neste ambiente, por isso o link aparece abaixo.",
    resetUrl: `/redefinir?token=${token}`,
  };
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const now = new Date();
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, parsed.data.token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now),
      ),
    )
    .limit(1);
  const tokenRow = rows[0];
  if (!tokenRow) {
    return { error: "Este link de recuperação é inválido ou expirou. Solicite um novo." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.update(users).set({ passwordHash, updatedAt: now }).where(eq(users.id, tokenRow.userId));
  await db.update(passwordResetTokens).set({ usedAt: now }).where(eq(passwordResetTokens.id, tokenRow.id));
  await db.delete(sessions).where(eq(sessions.userId, tokenRow.userId));

  redirect("/login?redefinida=1");
}

/* -------------------------------- perfil ------------------------------- */

export async function updateProfile(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  await db
    .update(users)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  return { message: "Perfil atualizado com sucesso." };
}

export async function changePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    current: formData.get("current"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const rows = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!rows[0] || !(await verifyPassword(parsed.data.current, rows[0].passwordHash))) {
    return { fieldErrors: { current: "Senha atual incorreta." } };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id));
  return { message: "Senha alterada com sucesso." };
}

export async function setAvatar(attachmentId: string | null): Promise<AuthState> {
  const user = await requireUser();
  if (attachmentId) {
    const rows = await db
      .select({ id: attachments.id })
      .from(attachments)
      .where(and(eq(attachments.id, attachmentId), eq(attachments.userId, user.id)))
      .limit(1);
    if (!rows[0]) return { error: "Arquivo não encontrado." };
  }
  await db.update(users).set({ avatarAttachmentId: attachmentId, updatedAt: new Date() }).where(eq(users.id, user.id));
  return { message: "Foto de perfil atualizada." };
}

/* ----------------------------- excluir conta --------------------------- */

export async function deleteAccount(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const user = await requireUser();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || email !== user.email.toLowerCase()) {
    return { fieldErrors: { email: "Digite exatamente o seu e-mail para confirmar a exclusão." } };
  }

  // Remove arquivos físicos (melhor esforço) antes de apagar os registros.
  const files = await db
    .select({ storedName: attachments.storedName })
    .from(attachments)
    .where(eq(attachments.userId, user.id));
  await deleteFiles(files.map((f) => f.storedName));

  await db.delete(users).where(eq(users.id, user.id));
  await destroySession();
  redirect("/?conta-excluida=1");
}

/* ------------------------- verificação de sessão ----------------------- */

export async function getSessionUser() {
  return getCurrentUser();
}
