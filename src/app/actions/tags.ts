"use server";

import { and, eq, ilike, asc } from "drizzle-orm";
import { db } from "@/db";
import { tags, noteTags, diaryTags } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { normalizeTagName } from "@/lib/utils";

export async function ensureTagIds(userId: string, names: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const raw of names) {
    const name = normalizeTagName(raw);
    if (!name) continue;
    const existing = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.name, name)))
      .limit(1);
    if (existing[0]) {
      ids.push(existing[0].id);
      continue;
    }
    const [created] = await db
      .insert(tags)
      .values({ userId, name })
      .onConflictDoNothing()
      .returning({ id: tags.id });
    if (created) {
      ids.push(created.id);
    } else {
      const again = await db
        .select({ id: tags.id })
        .from(tags)
        .where(and(eq(tags.userId, userId), eq(tags.name, name)))
        .limit(1);
      if (again[0]) ids.push(again[0].id);
    }
  }
  return ids;
}

export async function listTags(query = ""): Promise<string[]> {
  const user = await requireUser();
  const rows = await db
    .select({ name: tags.name })
    .from(tags)
    .where(
      query ? and(eq(tags.userId, user.id), ilike(tags.name, `%${query}%`)) : eq(tags.userId, user.id),
    )
    .orderBy(asc(tags.name))
    .limit(40);
  return rows.map((r) => r.name);
}

export async function setNoteTags(userId: string, noteId: string, tagIds: string[]): Promise<void> {
  await db.delete(noteTags).where(eq(noteTags.noteId, noteId));
  if (tagIds.length > 0) {
    await db
      .insert(noteTags)
      .values(tagIds.map((tagId) => ({ noteId, tagId })))
      .onConflictDoNothing();
  }
  void userId;
}

export async function setEntryTags(entryId: string, tagIds: string[]): Promise<void> {
  await db.delete(diaryTags).where(eq(diaryTags.entryId, entryId));
  if (tagIds.length > 0) {
    await db
      .insert(diaryTags)
      .values(tagIds.map((tagId) => ({ entryId, tagId })))
      .onConflictDoNothing();
  }
}
