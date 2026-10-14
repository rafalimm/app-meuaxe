import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { notes, noteTags, tags } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { categoriesWithCounts } from "@/lib/queries";
import { listNoteAttachments } from "@/app/actions/attachments";
import { getRelations } from "@/app/actions/notes";
import { NoteEditor, type EditableNote } from "@/components/note-editor";
import { TrashedNotice } from "@/components/trashed-notice";

export default async function NoteEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
    .limit(1);
  const note = rows[0];
  if (!note) notFound();

  if (note.deletedAt) {
    return (
      <TrashedNotice
        id={note.id}
        type="note"
        title={note.title || "Sem título"}
        backHref="/lixeira"
      />
    );
  }

  const [cats, noteTagRows, atts, relations] = await Promise.all([
    categoriesWithCounts(user.id),
    db
      .select({ name: tags.name })
      .from(noteTags)
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(eq(noteTags.noteId, id)),
    listNoteAttachments(id),
    getRelations(id),
  ]);

  const editable: EditableNote = {
    id: note.id,
    kind: note.kind,
    title: note.title,
    summary: note.summary,
    content: note.content,
    categoryId: note.categoryId,
    subcategory: note.subcategory,
    source: note.source,
    origin: note.origin,
    metadata: note.metadata ?? {},
    coverAttachmentId: note.coverAttachmentId,
    favorite: note.favorite,
    pinned: note.pinned,
    updatedAt: note.updatedAt.toISOString(),
  };

  return (
    <NoteEditor
      note={editable}
      categories={cats.map((c) => ({ id: c.id, name: c.name }))}
      initialTags={noteTagRows.map((t) => t.name)}
      attachments={atts.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        mimeType: a.mimeType,
        size: a.size,
        description: a.description,
        createdAt: a.createdAt.toISOString(),
        noteId: a.noteId,
        diaryEntryId: a.diaryEntryId,
      }))}
      relations={relations}
    />
  );
}
