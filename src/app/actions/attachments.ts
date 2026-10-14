"use server";

import { and, eq, isNull, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { attachments, notes, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { deleteFile } from "@/lib/storage";

export interface AttachmentState {
  ok?: boolean;
  error?: string;
  message?: string;
}

export async function updateAttachment(
  id: string,
  patch: { fileName?: string; description?: string },
): Promise<AttachmentState> {
  const user = await requireUser();
  const values: Partial<typeof attachments.$inferInsert> = {};
  if (patch.fileName !== undefined) {
    const name = patch.fileName.trim().slice(0, 200);
    if (!name) return { error: "O nome do arquivo não pode ficar vazio." };
    values.fileName = name;
  }
  if (patch.description !== undefined) values.description = patch.description.trim().slice(0, 1000);
  await db
    .update(attachments)
    .set(values)
    .where(and(eq(attachments.id, id), eq(attachments.userId, user.id)));
  revalidatePath("/biblioteca");
  return { ok: true, message: "Arquivo atualizado." };
}

export async function deleteAttachment(id: string): Promise<AttachmentState> {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(attachments)
    .where(and(eq(attachments.id, id), eq(attachments.userId, user.id)))
    .limit(1);
  const file = rows[0];
  if (!file) return { error: "Arquivo não encontrado." };

  // limpa referências de capa e avatar
  await db
    .update(notes)
    .set({ coverAttachmentId: null })
    .where(and(eq(notes.coverAttachmentId, id), eq(notes.userId, user.id)));
  await db
    .update(users)
    .set({ avatarAttachmentId: null })
    .where(and(eq(users.avatarAttachmentId, id), eq(users.id, user.id)));

  await db.delete(attachments).where(eq(attachments.id, id));
  await deleteFile(file.storedName);
  revalidatePath("/biblioteca");
  return { ok: true, message: "Arquivo excluído." };
}

export async function attachToNote(
  attachmentId: string,
  noteId: string | null,
  diaryEntryId: string | null = null,
): Promise<AttachmentState> {
  const user = await requireUser();
  if (noteId) {
    const n = await db
      .select({ id: notes.id })
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .limit(1);
    if (!n[0]) return { error: "Anotação não encontrada." };
  }
  await db
    .update(attachments)
    .set({ noteId, diaryEntryId })
    .where(and(eq(attachments.id, attachmentId), eq(attachments.userId, user.id)));
  revalidatePath("/biblioteca");
  return { ok: true };
}

export async function listNoteAttachments(noteId: string) {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.noteId, noteId),
        eq(attachments.userId, user.id),
        not(eq(attachments.purpose, "inline")),
      ),
    )
    .orderBy(attachments.createdAt);
  return rows;
}

export async function listDiaryAttachments(diaryEntryId: string) {
  const user = await requireUser();
  return db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.diaryEntryId, diaryEntryId),
        eq(attachments.userId, user.id),
        isNull(attachments.noteId),
      ),
    )
    .orderBy(attachments.createdAt);
}
