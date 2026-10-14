"use server";

import { and, eq, isNull, lt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { attachments, diaryEntries } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { diaryPatchSchema } from "@/lib/validation";
import { stripHtml } from "@/lib/utils";
import { TRASH_RETENTION_DAYS } from "@/lib/constants";
import { deleteFiles } from "@/lib/storage";
import { ensureTagIds, setEntryTags } from "./tags";
import type { NoteActionState } from "./notes";

export async function createDiaryEntry(): Promise<never> {
  const user = await requireUser();
  const [created] = await db
    .insert(diaryEntries)
    .values({ userId: user.id, entryDate: new Date() })
    .returning({ id: diaryEntries.id });
  redirect(`/diario/${created.id}?nova=1`);
}

export async function updateDiaryEntry(
  id: string,
  patch: unknown,
  tagNames?: string[],
): Promise<NoteActionState> {
  const user = await requireUser();
  const parsed = diaryPatchSchema.safeParse(patch);
  if (!parsed.success) return { error: "Dados inválidos." };

  const existing = await db
    .select()
    .from(diaryEntries)
    .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, user.id)))
    .limit(1);
  const entry = existing[0];
  if (!entry) return { error: "Registro não encontrado." };
  if (entry.deletedAt) return { error: "Este registro está na lixeira." };

  const d = parsed.data;
  const values: Partial<typeof diaryEntries.$inferInsert> = {};
  if (d.title !== undefined) values.title = d.title;
  if (d.content !== undefined) values.content = d.content;
  if (d.mood !== undefined) values.mood = d.mood;
  if (d.entryDate !== undefined && d.entryDate) {
    const date = new Date(d.entryDate);
    if (!Number.isNaN(date.getTime())) values.entryDate = date;
  }
  const nextTitle = d.title ?? entry.title;
  const nextContent = d.content ?? entry.content;
  values.contentText = `${nextTitle} ${stripHtml(nextContent)}`.replace(/\s+/g, " ").trim();
  values.updatedAt = new Date();

  await db
    .update(diaryEntries)
    .set(values)
    .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, user.id)));

  if (tagNames) {
    const ids = await ensureTagIds(user.id, tagNames);
    await setEntryTags(id, ids);
  }

  return { ok: true, savedAt: new Date().toISOString() };
}

export async function toggleDiaryFavorite(id: string, value: boolean): Promise<NoteActionState> {
  const user = await requireUser();
  await db
    .update(diaryEntries)
    .set({ favorite: value })
    .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, user.id)));
  revalidatePath("/favoritos");
  return { ok: true };
}

export async function moveEntryToTrash(id: string): Promise<NoteActionState> {
  const user = await requireUser();
  await db
    .update(diaryEntries)
    .set({ deletedAt: new Date() })
    .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, user.id), isNull(diaryEntries.deletedAt)));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function restoreEntry(id: string): Promise<NoteActionState> {
  const user = await requireUser();
  await db
    .update(diaryEntries)
    .set({ deletedAt: null })
    .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, user.id)));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteEntryForever(id: string): Promise<NoteActionState> {
  const user = await requireUser();
  const files = await db
    .select({ storedName: attachments.storedName })
    .from(attachments)
    .where(and(eq(attachments.diaryEntryId, id), eq(attachments.userId, user.id)));
  await deleteFiles(files.map((f) => f.storedName));
  await db.delete(attachments).where(and(eq(attachments.diaryEntryId, id), eq(attachments.userId, user.id)));
  await db.delete(diaryEntries).where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, user.id)));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function purgeExpiredDiaryTrash(): Promise<{ purged: number }> {
  const user = await requireUser();
  const limit = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const expired = await db
    .select({ id: diaryEntries.id })
    .from(diaryEntries)
    .where(and(eq(diaryEntries.userId, user.id), lt(diaryEntries.deletedAt, limit)));
  for (const row of expired) {
    await deleteEntryForever(row.id);
  }
  return { purged: expired.length };
}
