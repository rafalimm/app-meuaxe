import { and, asc, count, desc, eq, gte, ilike, isNotNull, isNull, ne, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { attachments, categories, diaryEntries, diaryTags, noteTags, notes, tags, userPreferences } from "@/db/schema";

export interface NoteListItem {
  id: string;
  kind: string;
  title: string;
  summary: string;
  excerpt: string;
  favorite: boolean;
  pinned: boolean;
  origin: string;
  updatedAt: string;
  createdAt: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  tags: string[];
}

export interface NoteListOptions {
  kinds?: string[];
  q?: string;
  categoryId?: string;
  favorite?: boolean;
  deleted?: boolean;
  orderByUpdated?: boolean;
  limit?: number;
}

function mapRows(
  rows: Array<{
    id: string;
    kind: string;
    title: string;
    summary: string;
    contentText: string;
    favorite: boolean;
    pinned: boolean;
    origin: string;
    updatedAt: Date;
    createdAt: Date;
    categoryId: string | null;
    categoryName: string | null;
    categoryColor: string | null;
  }>,
  tagsByNote: Map<string, string[]>,
): NoteListItem[] {
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    summary: r.summary,
    excerpt: (r.summary || r.contentText || "").slice(0, 200),
    favorite: r.favorite,
    pinned: r.pinned,
    origin: r.origin,
    updatedAt: r.updatedAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    categoryColor: r.categoryColor,
    tags: tagsByNote.get(r.id) ?? [],
  }));
}

async function tagsForNotes(userId: string): Promise<Map<string, string[]>> {
  const rows = await db
    .select({ noteId: noteTags.noteId, name: tags.name })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(eq(tags.userId, userId));
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.noteId) ?? [];
    list.push(row.name);
    map.set(row.noteId, list);
  }
  return map;
}

export async function listNotes(userId: string, opts: NoteListOptions = {}): Promise<NoteListItem[]> {
  const conds: SQL<unknown>[] = [eq(notes.userId, userId)];
  if (opts.deleted) conds.push(isNotNull(notes.deletedAt));
  else conds.push(isNull(notes.deletedAt));
  if (opts.kinds && opts.kinds.length === 1) conds.push(eq(notes.kind, opts.kinds[0]));
  else if (opts.kinds && opts.kinds.length > 1) {
    const orCond = or(...opts.kinds.map((k) => eq(notes.kind, k)));
    if (orCond) conds.push(orCond);
  }
  if (opts.q) {
    const like = `%${opts.q}%`;
    const orCond = or(
      ilike(notes.title, like),
      ilike(notes.contentText, like),
      ilike(notes.summary, like),
      ilike(notes.subcategory, like),
      ilike(notes.source, like),
    );
    if (orCond) conds.push(orCond);
  }
  if (opts.categoryId === "none") conds.push(isNull(notes.categoryId));
  else if (opts.categoryId) conds.push(eq(notes.categoryId, opts.categoryId));
  if (opts.favorite) conds.push(eq(notes.favorite, true));

  const rows = await db
    .select({
      id: notes.id,
      kind: notes.kind,
      title: notes.title,
      summary: notes.summary,
      contentText: notes.contentText,
      favorite: notes.favorite,
      pinned: notes.pinned,
      origin: notes.origin,
      updatedAt: notes.updatedAt,
      createdAt: notes.createdAt,
      categoryId: notes.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(notes)
    .leftJoin(categories, eq(notes.categoryId, categories.id))
    .where(and(...conds))
    .orderBy(desc(notes.pinned), opts.orderByUpdated === false ? desc(notes.createdAt) : desc(notes.updatedAt))
    .limit(opts.limit ?? 300);

  const tagsMap = await tagsForNotes(userId);
  return mapRows(rows, tagsMap);
}

export async function dashboardStats(userId: string) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [all, fundamentos, favNotes, favDiary, recent] = await Promise.all([
    db
      .select({ value: count() })
      .from(notes)
      .where(and(eq(notes.userId, userId), isNull(notes.deletedAt))),
    db
      .select({ value: count() })
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.kind, "fundamento"), isNull(notes.deletedAt))),
    db
      .select({ value: count() })
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.favorite, true), isNull(notes.deletedAt))),
    db
      .select({ value: count() })
      .from(diaryEntries)
      .where(and(eq(diaryEntries.userId, userId), eq(diaryEntries.favorite, true), isNull(diaryEntries.deletedAt))),
    db
      .select({ value: count() })
      .from(notes)
      .where(and(eq(notes.userId, userId), isNull(notes.deletedAt), gte(notes.updatedAt, weekAgo))),
  ]);
  return {
    total: all[0]?.value ?? 0,
    fundamentos: fundamentos[0]?.value ?? 0,
    favorites: (favNotes[0]?.value ?? 0) + (favDiary[0]?.value ?? 0),
    updatedRecently: recent[0]?.value ?? 0,
  };
}

export async function categoriesWithCounts(userId: string) {
  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  const counts = await db
    .select({ categoryId: notes.categoryId, value: count() })
    .from(notes)
    .where(and(eq(notes.userId, userId), isNull(notes.deletedAt)))
    .groupBy(notes.categoryId);
  const map = new Map(counts.map((c) => [c.categoryId, c.value]));
  return cats.map((c) => ({ ...c, noteCount: map.get(c.id) ?? 0 }));
}

export async function recentAttachments(userId: string, limit = 5) {
  const rows = await db
    .select()
    .from(attachments)
    .where(and(eq(attachments.userId, userId), ne(attachments.purpose, "inline")))
    .orderBy(desc(attachments.createdAt))
    .limit(limit);
  return rows;
}

export async function getPreferences(userId: string) {
  const rows = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export interface DiaryListItem {
  id: string;
  title: string;
  excerpt: string;
  mood: string;
  entryDate: string;
  favorite: boolean;
  tags: string[];
}

export async function listDiaryEntries(userId: string, deleted = false): Promise<DiaryListItem[]> {
  const conds: SQL<unknown>[] = [eq(diaryEntries.userId, userId)];
  if (deleted) conds.push(isNotNull(diaryEntries.deletedAt));
  else conds.push(isNull(diaryEntries.deletedAt));
  const rows = await db
    .select()
    .from(diaryEntries)
    .where(and(...conds))
    .orderBy(desc(diaryEntries.entryDate))
    .limit(400);

  const dTagRows = await db
    .select({ entryId: diaryTags.entryId, name: tags.name })
    .from(diaryTags)
    .innerJoin(tags, eq(diaryTags.tagId, tags.id))
    .where(eq(tags.userId, userId));
  const map = new Map<string, string[]>();
  for (const row of dTagRows) {
    const list = map.get(row.entryId) ?? [];
    list.push(row.name);
    map.set(row.entryId, list);
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.contentText.slice(0, 220),
    mood: r.mood,
    entryDate: r.entryDate.toISOString(),
    favorite: r.favorite,
    tags: map.get(r.id) ?? [],
  }));
}
