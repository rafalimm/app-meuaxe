"use server";

import { and, eq, asc, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, notes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { categorySchema } from "@/lib/validation";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import type { AuthState } from "./auth";

export async function ensureDefaultCategories(userId: string): Promise<void> {
  const [row] = await db
    .select({ value: count() })
    .from(categories)
    .where(eq(categories.userId, userId));
  if (row.value === 0) {
    await db.insert(categories).values(
      DEFAULT_CATEGORIES.map((c, i) => ({ ...c, userId, sortOrder: i })),
    );
  }
}

export async function listCategories() {
  const user = await requireUser();
  await ensureDefaultCategories(user.id);
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, user.id))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function createCategory(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const user = await requireUser();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    icon: formData.get("icon") ?? "Folder",
    color: formData.get("color") ?? "#173D30",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  await db.insert(categories).values({ ...parsed.data, userId: user.id });
  revalidatePath("/", "layout");
  return { message: "Categoria criada." };
}

export async function updateCategory(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    icon: formData.get("icon") ?? "Folder",
    color: formData.get("color") ?? "#173D30",
  });
  if (!id || !parsed.success) {
    return { error: parsed.success ? "Categoria inválida." : parsed.error.issues[0]?.message };
  }
  await db
    .update(categories)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)));
  revalidatePath("/", "layout");
  return { message: "Categoria atualizada." };
}

/**
 * Exclui uma categoria. As anotações NUNCA são apagadas: elas são movidas
 * para a categoria escolhida (reassignToId) ou ficam sem categoria (null).
 */
export async function deleteCategory(id: string, reassignToId: string | null): Promise<AuthState> {
  const user = await requireUser();
  const rows = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
    .limit(1);
  if (!rows[0]) return { error: "Categoria não encontrada." };

  if (reassignToId === id) return { error: "Escolha outra categoria para mover as anotações." };

  await db
    .update(notes)
    .set({ categoryId: reassignToId, updatedAt: new Date() })
    .where(and(eq(notes.categoryId, id), eq(notes.userId, user.id)));

  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/", "layout");
  return { message: "Categoria excluída. Suas anotações foram preservadas." };
}

export async function reorderCategories(orderedIds: string[]): Promise<AuthState> {
  const user = await requireUser();
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(categories)
      .set({ sortOrder: i })
      .where(and(eq(categories.id, orderedIds[i]), eq(categories.userId, user.id)));
  }
  revalidatePath("/", "layout");
  return { message: "Ordem atualizada." };
}
