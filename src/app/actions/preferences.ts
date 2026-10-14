"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { requireUser, THEME_COOKIE } from "@/lib/auth";

export interface PrefState {
  ok?: boolean;
  error?: string;
  message?: string;
}

async function upsertPrefs(userId: string, values: Partial<typeof userPreferences.$inferInsert>) {
  const existing = await db
    .select({ userId: userPreferences.userId })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  if (existing[0]) {
    await db
      .update(userPreferences)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({ userId, ...values });
  }
}

export async function setTheme(theme: "light" | "dark"): Promise<PrefState> {
  const user = await requireUser();
  if (theme !== "light" && theme !== "dark") return { error: "Tema inválido." };
  await upsertPrefs(user.id, { theme });
  const store = await cookies();
  store.set(THEME_COOKIE, theme, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setA11y(values: {
  reducedMotion?: boolean;
  largeText?: boolean;
}): Promise<PrefState> {
  const user = await requireUser();
  await upsertPrefs(user.id, values);
  return { ok: true };
}

export async function setDashboardGoal(goal: string): Promise<PrefState> {
  const user = await requireUser();
  await upsertPrefs(user.id, { dashboardGoal: goal.slice(0, 200) });
  revalidatePath("/inicio");
  return { ok: true, message: "Objetivo atualizado." };
}
