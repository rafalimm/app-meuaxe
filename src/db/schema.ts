import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Tipos auxiliares                                                    */
/* ------------------------------------------------------------------ */

export interface NoteMetadata {
  scientificName?: string;
  purpose?: string;
  materials?: string[];
  ingredients?: string[];
  preparation?: string;
  safetyNotes?: string;
  entityType?: string;
  lineage?: string;
  occasion?: string;
}

export interface UserPreferencesData {
  theme?: "light" | "dark";
  reducedMotion?: boolean;
  largeText?: boolean;
  dashboardGoal?: string;
}

/* ------------------------------------------------------------------ */
/* Autenticação e perfil                                               */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    avatarAttachmentId: uuid("avatar_attachment_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_key").on(t.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sessions_token_key").on(t.token), index("sessions_user_idx").on(t.userId)],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("password_reset_tokens_token_key").on(t.token)],
);

/* ------------------------------------------------------------------ */
/* Organização                                                         */
/* ------------------------------------------------------------------ */

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    icon: text("icon").notNull().default("Folder"),
    color: text("color").notNull().default("#173D30"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("categories_user_idx").on(t.userId)],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("tags_user_name_key").on(t.userId, t.name)],
);

/* ------------------------------------------------------------------ */
/* Anotações / estudos (caderno, fundamentos, ervas, pratos, entidades) */
/* ------------------------------------------------------------------ */

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("note"),
    title: text("title").notNull().default(""),
    summary: text("summary").notNull().default(""),
    content: text("content").notNull().default(""),
    contentText: text("content_text").notNull().default(""),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    subcategory: text("subcategory").notNull().default(""),
    source: text("source").notNull().default(""),
    origin: text("origin").notNull().default("pessoal"),
    metadata: jsonb("metadata").$type<NoteMetadata>().notNull().default({}),
    coverAttachmentId: uuid("cover_attachment_id"),
    pinned: boolean("pinned").notNull().default(false),
    favorite: boolean("favorite").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("notes_user_idx").on(t.userId),
    index("notes_category_idx").on(t.categoryId),
    index("notes_deleted_idx").on(t.deletedAt),
    index("notes_kind_idx").on(t.userId, t.kind),
  ],
);

export const noteTags = pgTable(
  "note_tags",
  {
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.noteId, t.tagId] })],
);

export const noteRelations = pgTable(
  "note_relations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fromNoteId: uuid("from_note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    toNoteId: uuid("to_note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("note_relations_pair_key").on(t.fromNoteId, t.toNoteId)],
);

/* ------------------------------------------------------------------ */
/* Diário espiritual                                                   */
/* ------------------------------------------------------------------ */

export const diaryEntries = pgTable(
  "diary_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    content: text("content").notNull().default(""),
    contentText: text("content_text").notNull().default(""),
    mood: text("mood").notNull().default(""),
    entryDate: timestamp("entry_date", { withTimezone: true }).notNull().defaultNow(),
    favorite: boolean("favorite").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("diary_user_idx").on(t.userId), index("diary_deleted_idx").on(t.deletedAt)],
);

export const diaryTags = pgTable(
  "diary_tags",
  {
    entryId: uuid("entry_id")
      .notNull()
      .references(() => diaryEntries.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.entryId, t.tagId] })],
);

/* ------------------------------------------------------------------ */
/* Arquivos                                                            */
/* ------------------------------------------------------------------ */

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    noteId: uuid("note_id").references(() => notes.id, { onDelete: "set null" }),
    diaryEntryId: uuid("diary_entry_id").references(() => diaryEntries.id, { onDelete: "set null" }),
    fileName: text("file_name").notNull(),
    storedName: text("stored_name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull().default(0),
    description: text("description").notNull().default(""),
    purpose: text("purpose").notNull().default("library"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("attachments_user_idx").on(t.userId), index("attachments_note_idx").on(t.noteId)],
);

/* ------------------------------------------------------------------ */
/* Preferências                                                        */
/* ------------------------------------------------------------------ */

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("light"),
  reducedMotion: boolean("reduced_motion").notNull().default(false),
  largeText: boolean("large_text").notNull().default(false),
  dashboardGoal: text("dashboard_goal").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Tipos inferidos                                                     */
/* ------------------------------------------------------------------ */

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
