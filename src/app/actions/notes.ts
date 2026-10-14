"use server";

import { and, desc, eq, ilike, isNull, lt, ne, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { attachments, noteRelations, notes, tags, noteTags } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { notePatchSchema, quickNoteSchema } from "@/lib/validation";
import { NOTE_KIND_MAP, TRASH_RETENTION_DAYS } from "@/lib/constants";
import { stripHtml } from "@/lib/utils";
import { deleteFiles } from "@/lib/storage";
import { ensureTagIds, setNoteTags } from "./tags";

export interface NoteActionState {
  ok?: boolean;
  error?: string;
  savedAt?: string;
  id?: string;
}

function buildSearchText(input: {
  title?: string;
  summary?: string;
  subcategory?: string;
  source?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}): string {
  const parts: string[] = [input.title ?? "", input.summary ?? "", input.subcategory ?? "", input.source ?? ""];
  if (input.content) parts.push(stripHtml(input.content));
  const meta = input.metadata ?? {};
  for (const key of Object.keys(meta)) {
    const v = meta[key];
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) parts.push(v.filter((x): x is string => typeof x === "string").join(" "));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/* ------------------------------- criação ------------------------------- */

export async function createNote(input: {
  kind?: string;
  title?: string;
  categoryId?: string | null;
}): Promise<never> {
  const user = await requireUser();
  const parsed = quickNoteSchema.safeParse(input ?? {});
  const data = parsed.success ? parsed.data : { kind: "note" as const };
  const [created] = await db
    .insert(notes)
    .values({
      userId: user.id,
      kind: data.kind,
      title: data.title ?? "",
      categoryId: data.categoryId ?? null,
    })
    .returning({ id: notes.id });
  redirect(`/caderno/${created.id}?nova=1`);
}

/* --------------------------- atualização (auto) ------------------------ */

export async function updateNote(
  id: string,
  patch: unknown,
  tagNames?: string[],
): Promise<NoteActionState> {
  const user = await requireUser();
  const parsed = notePatchSchema.safeParse(patch);
  if (!parsed.success) {
    return { error: "Dados inválidos. Verifique os campos e tente novamente." };
  }

  const existing = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
    .limit(1);
  const current = existing[0];
  if (!current) return { error: "Anotação não encontrada." };
  if (current.deletedAt) return { error: "Esta anotação está na lixeira. Restaure-a para editar." };

  if (parsed.data.categoryId) {
    const valid = await db
      .select({ id: notes.id })
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
      .limit(1);
    void valid;
  }

  const d = parsed.data;
  const patchValues: Partial<typeof notes.$inferInsert> = {};
  if (d.title !== undefined) patchValues.title = d.title;
  if (d.summary !== undefined) patchValues.summary = d.summary;
  if (d.content !== undefined) patchValues.content = d.content;
  if (d.categoryId !== undefined) patchValues.categoryId = d.categoryId;
  if (d.subcategory !== undefined) patchValues.subcategory = d.subcategory;
  if (d.source !== undefined) patchValues.source = d.source;
  if (d.origin !== undefined) patchValues.origin = d.origin;
  if (d.kind !== undefined && NOTE_KIND_MAP[d.kind]) patchValues.kind = d.kind;
  if (d.metadata !== undefined) {
    patchValues.metadata = d.metadata as typeof notes.$inferInsert.metadata;
  }
  if (d.coverAttachmentId !== undefined) patchValues.coverAttachmentId = d.coverAttachmentId;

  const nextTitle = d.title ?? current.title;
  const nextSummary = d.summary ?? current.summary;
  const nextContent = d.content ?? current.content;
  const nextSub = d.subcategory ?? current.subcategory;
  const nextSource = d.source ?? current.source;
  const nextMeta = (d.metadata ?? current.metadata) as Record<string, unknown>;
  patchValues.contentText = buildSearchText({
    title: nextTitle,
    summary: nextSummary,
    subcategory: nextSub,
    source: nextSource,
    content: nextContent,
    metadata: nextMeta,
  });
  patchValues.updatedAt = new Date();

  await db
    .update(notes)
    .set(patchValues)
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)));

  if (tagNames) {
    const ids = await ensureTagIds(user.id, tagNames);
    await setNoteTags(user.id, id, ids);
  }

  return { ok: true, savedAt: new Date().toISOString() };
}

/* --------------------------- favoritos / fixar ------------------------- */

export async function toggleFavorite(id: string, value: boolean): Promise<NoteActionState> {
  const user = await requireUser();
  await db
    .update(notes)
    .set({ favorite: value })
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)));
  revalidatePath("/favoritos");
  return { ok: true };
}

export async function togglePin(id: string, value: boolean): Promise<NoteActionState> {
  const user = await requireUser();
  await db
    .update(notes)
    .set({ pinned: value })
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)));
  revalidatePath("/caderno");
  return { ok: true };
}

/* -------------------------------- lixeira ------------------------------ */

export async function moveNoteToTrash(id: string): Promise<NoteActionState> {
  const user = await requireUser();
  await db
    .update(notes)
    .set({ deletedAt: new Date() })
    .where(and(eq(notes.id, id), eq(notes.userId, user.id), isNull(notes.deletedAt)));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function restoreNote(id: string): Promise<NoteActionState> {
  const user = await requireUser();
  await db
    .update(notes)
    .set({ deletedAt: null })
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)));
  revalidatePath("/", "layout");
  return { ok: true };
}

async function deleteNotePermanently(noteId: string, userId: string): Promise<void> {
  const files = await db
    .select({ storedName: attachments.storedName })
    .from(attachments)
    .where(and(eq(attachments.noteId, noteId), eq(attachments.userId, userId)));
  await deleteFiles(files.map((f) => f.storedName));
  await db.delete(attachments).where(and(eq(attachments.noteId, noteId), eq(attachments.userId, userId)));
  await db.delete(notes).where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
}

export async function deleteNoteForever(id: string): Promise<NoteActionState> {
  const user = await requireUser();
  await deleteNotePermanently(id, user.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Remove definitivamente itens na lixeira há mais de 30 dias. */
export async function purgeExpiredTrash(): Promise<{ purged: number }> {
  const user = await requireUser();
  const limit = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const expired = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.userId, user.id), lt(notes.deletedAt, limit)));
  for (const row of expired) {
    await deleteNotePermanently(row.id, user.id);
  }
  revalidatePath("/", "layout");
  return { purged: expired.length };
}

/* ------------------------------ duplicar ------------------------------- */

export async function duplicateNote(id: string): Promise<NoteActionState> {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
    .limit(1);
  const note = rows[0];
  if (!note) return { error: "Anotação não encontrada." };

  const baseTitle = (note.title || "Sem título").replace(/ \(cópia\)$/, "");
  const [created] = await db
    .insert(notes)
    .values({
      userId: user.id,
      kind: note.kind,
      title: `${baseTitle} (cópia)`,
      summary: note.summary,
      content: note.content,
      contentText: note.contentText,
      categoryId: note.categoryId,
      subcategory: note.subcategory,
      source: note.source,
      origin: note.origin,
      metadata: note.metadata,
    })
    .returning({ id: notes.id });

  const tagRows = await db
    .select({ name: tags.name })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(eq(noteTags.noteId, id));
  if (tagRows.length > 0) {
    const ids = await ensureTagIds(user.id, tagRows.map((t) => t.name));
    await setNoteTags(user.id, created.id, ids);
  }

  revalidatePath("/", "layout");
  return { ok: true, id: created.id };
}

/* ----------------------------- relacionamentos ------------------------- */

export async function searchLinkableNotes(query: string, excludeId: string) {
  const user = await requireUser();
  const cond = query ? ilike(notes.title, `%${query}%`) : undefined;
  const rows = await db
    .select({ id: notes.id, title: notes.title, kind: notes.kind, updatedAt: notes.updatedAt })
    .from(notes)
    .where(and(eq(notes.userId, user.id), isNull(notes.deletedAt), ne(notes.id, excludeId), cond))
    .orderBy(desc(notes.updatedAt))
    .limit(12);
  return rows.map((r) => ({
    id: r.id,
    title: r.title || "Sem título",
    kind: r.kind,
  }));
}

export async function getRelations(noteId: string) {
  const user = await requireUser();
  const rows = await db
    .select({
      id: noteRelations.id,
      toId: notes.id,
      toTitle: notes.title,
      toKind: notes.kind,
    })
    .from(noteRelations)
    .innerJoin(notes, eq(noteRelations.toNoteId, notes.id))
    .where(and(eq(noteRelations.fromNoteId, noteId), eq(noteRelations.userId, user.id)));
  return rows.map((r) => ({ id: r.id, toId: r.toId, title: r.toTitle || "Sem título", kind: r.toKind }));
}

export async function addRelation(fromNoteId: string, toNoteId: string): Promise<NoteActionState> {
  const user = await requireUser();
  if (fromNoteId === toNoteId) return { error: "Não é possível relacionar uma anotação a ela mesma." };
  const target = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.id, toNoteId), eq(notes.userId, user.id)))
    .limit(1);
  if (!target[0]) return { error: "Registro não encontrado." };
  await db
    .insert(noteRelations)
    .values({ userId: user.id, fromNoteId, toNoteId })
    .onConflictDoNothing();
  revalidatePath(`/caderno/${fromNoteId}`);
  return { ok: true };
}

export async function removeRelation(relationId: string): Promise<NoteActionState> {
  const user = await requireUser();
  await db
    .delete(noteRelations)
    .where(and(eq(noteRelations.id, relationId), eq(noteRelations.userId, user.id)));
  revalidatePath("/", "layout");
  return { ok: true };
}
