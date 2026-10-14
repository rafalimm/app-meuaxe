"use server";

import { and, asc, desc, eq, gte, ilike, isNull, lte, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { attachments, categories, diaryEntries, noteTags, notes, tags } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { searchSchema } from "@/lib/validation";

export interface SearchNoteResult {
  id: string;
  kind: string;
  title: string;
  summary: string;
  excerpt: string;
  favorite: boolean;
  categoryName: string | null;
  updatedAt: string;
  tags: string[];
}

export interface SearchDiaryResult {
  id: string;
  title: string;
  excerpt: string;
  mood: string;
  entryDate: string;
}

export interface SearchFileResult {
  id: string;
  fileName: string;
  description: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface GlobalSearchResult {
  notes: SearchNoteResult[];
  diary: SearchDiaryResult[];
  files: SearchFileResult[];
  total: number;
}

function excerptOf(text: string, q: string, len = 220): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!q) return clean.slice(0, len);
  const idx = clean.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return clean.slice(0, len);
  const start = Math.max(0, idx - 60);
  return `${start > 0 ? "…" : ""}${clean.slice(start, start + len)}`;
}

export async function globalSearch(rawParams: unknown): Promise<GlobalSearchResult> {
  const user = await requireUser();
  const parsed = searchSchema.safeParse(rawParams);
  const params = parsed.success
    ? parsed.data
    : { q: "", kind: "", categoryId: "", favorite: false, from: "", to: "", tag: "", sort: "updated" as const, includeDiary: true, includeFiles: true };

  const { q, kind, categoryId, favorite, from, to, tag, sort } = params;
  const like = `%${q}%`;

  /* ------------------------------ anotações ------------------------------ */

  const noteConds: SQL<unknown>[] = [eq(notes.userId, user.id), isNull(notes.deletedAt)];
  if (q) {
    const orCond = or(
      ilike(notes.title, like),
      ilike(notes.contentText, like),
      ilike(notes.summary, like),
      ilike(notes.subcategory, like),
      ilike(notes.source, like),
    );
    if (orCond) noteConds.push(orCond);
  }
  if (kind) noteConds.push(eq(notes.kind, kind));
  if (categoryId === "none") noteConds.push(isNull(notes.categoryId));
  else if (categoryId) noteConds.push(eq(notes.categoryId, categoryId));
  if (favorite) noteConds.push(eq(notes.favorite, true));
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) noteConds.push(gte(notes.createdAt, d));
  }
  if (to) {
    const d = new Date(`${to}T23:59:59`);
    if (!Number.isNaN(d.getTime())) noteConds.push(lte(notes.createdAt, d));
  }

  const orderCol =
    sort === "alpha"
      ? asc(notes.title)
      : sort === "oldest"
        ? asc(notes.createdAt)
        : sort === "recent"
          ? desc(notes.createdAt)
          : desc(notes.updatedAt);

  const noteRows = await db
    .select({
      id: notes.id,
      kind: notes.kind,
      title: notes.title,
      summary: notes.summary,
      contentText: notes.contentText,
      favorite: notes.favorite,
      updatedAt: notes.updatedAt,
      categoryName: categories.name,
    })
    .from(notes)
    .leftJoin(categories, eq(notes.categoryId, categories.id))
    .where(and(...noteConds))
    .orderBy(orderCol)
    .limit(80);

  // tag lookup para os resultados
  const noteIds = noteRows.map((r) => r.id);
  const tagRows = noteIds.length
    ? await db
        .select({ noteId: noteTags.noteId, name: tags.name })
        .from(noteTags)
        .innerJoin(tags, eq(noteTags.tagId, tags.id))
        .where(eq(tags.userId, user.id))
    : [];
  const tagsByNote = new Map<string, string[]>();
  for (const row of tagRows) {
    const list = tagsByNote.get(row.noteId) ?? [];
    list.push(row.name);
    tagsByNote.set(row.noteId, list);
  }

  let noteResults: SearchNoteResult[] = noteRows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    summary: r.summary,
    excerpt: excerptOf(r.contentText || r.summary || "", q),
    favorite: r.favorite,
    categoryName: r.categoryName,
    updatedAt: r.updatedAt.toISOString(),
    tags: tagsByNote.get(r.id) ?? [],
  }));

  if (tag) {
    const wanted = tag.toLowerCase();
    const taggedIds = new Set(
      tagRows.filter((r) => r.name.toLowerCase() === wanted).map((r) => r.noteId),
    );
    noteResults = noteResults.filter((r) => taggedIds.has(r.id));
    if (q) {
      noteResults = noteResults.filter(
        (r) =>
          r.title.toLowerCase().includes(q.toLowerCase()) ||
          r.excerpt.toLowerCase().includes(q.toLowerCase()) ||
          r.tags.some((t) => t.toLowerCase().includes(q.toLowerCase())),
      );
    }
  }

  /* -------------------------------- diário ------------------------------- */

  let diaryResults: SearchDiaryResult[] = [];
  if (params.includeDiary && (q || favorite)) {
    const conds: SQL<unknown>[] = [eq(diaryEntries.userId, user.id), isNull(diaryEntries.deletedAt)];
    if (q) conds.push(ilike(diaryEntries.contentText, like));
    if (favorite) conds.push(eq(diaryEntries.favorite, true));
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) conds.push(gte(diaryEntries.entryDate, d));
    }
    if (to) {
      const d = new Date(`${to}T23:59:59`);
      if (!Number.isNaN(d.getTime())) conds.push(lte(diaryEntries.entryDate, d));
    }
    const rows = await db
      .select()
      .from(diaryEntries)
      .where(and(...conds))
      .orderBy(desc(diaryEntries.entryDate))
      .limit(40);
    diaryResults = rows.map((r) => ({
      id: r.id,
      title: r.title,
      excerpt: excerptOf(r.contentText, q),
      mood: r.mood,
      entryDate: r.entryDate.toISOString(),
    }));
  }

  /* ------------------------------- arquivos ------------------------------ */

  let fileResults: SearchFileResult[] = [];
  if (params.includeFiles && q) {
    const orCond = or(ilike(attachments.fileName, like), ilike(attachments.description, like));
    if (orCond) {
      const rows = await db
        .select()
        .from(attachments)
        .where(and(eq(attachments.userId, user.id), orCond))
        .orderBy(desc(attachments.createdAt))
        .limit(40);
      fileResults = rows.map((r) => ({
        id: r.id,
        fileName: r.fileName,
        description: r.description,
        mimeType: r.mimeType,
        size: r.size,
        createdAt: r.createdAt.toISOString(),
      }));
    }
  }

  return {
    notes: noteResults,
    diary: diaryResults,
    files: fileResults,
    total: noteResults.length + diaryResults.length + fileResults.length,
  };
}
