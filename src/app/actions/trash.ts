"use server";

import { and, eq, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { attachments, diaryEntries, notes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { deleteFiles } from "@/lib/storage";

/** Esvazia a lixeira inteira (notas + diário), removendo também os arquivos. */
export async function emptyTrash(): Promise<{ purged: number; error?: string }> {
  const user = await requireUser();

  const trashedNotes = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.userId, user.id), isNotNull(notes.deletedAt)));

  const trashedEntries = await db
    .select({ id: diaryEntries.id })
    .from(diaryEntries)
    .where(and(eq(diaryEntries.userId, user.id), isNotNull(diaryEntries.deletedAt)));

  for (const row of trashedNotes) {
    const files = await db
      .select({ storedName: attachments.storedName })
      .from(attachments)
      .where(and(eq(attachments.noteId, row.id), eq(attachments.userId, user.id)));
    await deleteFiles(files.map((f) => f.storedName));
    await db.delete(attachments).where(and(eq(attachments.noteId, row.id), eq(attachments.userId, user.id)));
    await db.delete(notes).where(and(eq(notes.id, row.id), eq(notes.userId, user.id)));
  }

  for (const row of trashedEntries) {
    const files = await db
      .select({ storedName: attachments.storedName })
      .from(attachments)
      .where(and(eq(attachments.diaryEntryId, row.id), eq(attachments.userId, user.id)));
    await deleteFiles(files.map((f) => f.storedName));
    await db
      .delete(attachments)
      .where(and(eq(attachments.diaryEntryId, row.id), eq(attachments.userId, user.id)));
    await db.delete(diaryEntries).where(and(eq(diaryEntries.id, row.id), eq(diaryEntries.userId, user.id)));
  }

  revalidatePath("/", "layout");
  return { purged: trashedNotes.length + trashedEntries.length };
}
