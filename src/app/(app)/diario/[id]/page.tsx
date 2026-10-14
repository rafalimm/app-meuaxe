import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { diaryEntries, diaryTags, tags } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { listDiaryAttachments } from "@/app/actions/attachments";
import { DiaryEditor, type EditableEntry } from "@/components/diary-editor";
import { TrashedNotice } from "@/components/trashed-notice";

export default async function DiaryEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const rows = await db
    .select()
    .from(diaryEntries)
    .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, user.id)))
    .limit(1);
  const entry = rows[0];
  if (!entry) notFound();

  if (entry.deletedAt) {
    return (
      <TrashedNotice id={entry.id} type="diary" title={entry.title || "Sem título"} backHref="/lixeira" />
    );
  }

  const [tagRows, atts] = await Promise.all([
    db
      .select({ name: tags.name })
      .from(diaryTags)
      .innerJoin(tags, eq(diaryTags.tagId, tags.id))
      .where(eq(diaryTags.entryId, id)),
    listDiaryAttachments(id),
  ]);

  const editable: EditableEntry = {
    id: entry.id,
    title: entry.title,
    content: entry.content,
    mood: entry.mood,
    entryDate: entry.entryDate.toISOString(),
    favorite: entry.favorite,
    updatedAt: entry.updatedAt.toISOString(),
  };

  return (
    <DiaryEditor
      entry={editable}
      initialTags={tagRows.map((t) => t.name)}
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
    />
  );
}
