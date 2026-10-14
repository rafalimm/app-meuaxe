import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

const scryptAsync = promisify(scrypt);

export const SESSION_COOKIE = "mx_session";
export const THEME_COOKIE = "mx-theme";
const SESSION_TTL_DAYS = 30;

/* ------------------------------- senhas ------------------------------- */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [salt, hex] = stored.split(":");
    if (!salt || !hex) return false;
    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    const expected = Buffer.from(hex, "hex");
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/* ------------------------------ sessões ------------------------------- */

export function newToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ userId, token, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  store.delete(SESSION_COOKIE);
}

/* --------------------------- usuário atual ---------------------------- */

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  avatarAttachmentId: string | null;
  createdAt: Date;
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const now = new Date();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarAttachmentId: users.avatarAttachmentId,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
    .limit(1);
  return rows[0] ?? null;
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
