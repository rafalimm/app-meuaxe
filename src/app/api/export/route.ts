import { NextResponse } from "next/server";
import JSZip from "jszip";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  attachments,
  categories,
  diaryEntries,
  diaryTags,
  noteRelations,
  noteTags,
  notes,
  tags,
  type Note,
  type DiaryEntry,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { readFileBuffer } from "@/lib/storage";
import { stripHtml } from "@/lib/utils";
import { NOTE_KIND_MAP, MOOD_LABELS, ORIGIN_OPTIONS, APP_NAME } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 120;

/* ----------------------------- utilidades ------------------------------ */

function slugify(text: string, fallback = "registro"): string {
  const s = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || fallback;
}

function htmlToMarkdown(html: string): string {
  let out = html;
  out = out.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, c) => `\n\n## ${stripHtml(String(c))}\n\n`);
  out = out.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, c) => `\n\n### ${stripHtml(String(c))}\n\n`);
  out = out.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, c) =>
    String(stripHtml(String(c)))
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n"),
  );
  out = out.replace(/<li[^>]*data-type="taskItem"[^>]*data-checked="true"[^>]*>([\s\S]*?)<\/li>/gi, (_m, c) => `\n- [x] ${stripHtml(String(c))}`);
  out = out.replace(/<li[^>]*data-type="taskItem"[^>]*>([\s\S]*?)<\/li>/gi, (_m, c) => `\n- [ ] ${stripHtml(String(c))}`);
  out = out.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, c) => `\n- ${stripHtml(String(c))}`);
  out = out.replace(/<img[^>]*src="([^"]+)"[^>]*>/gi, (_m, src) => `\n\n![imagem](${src})\n\n`);
  out = out.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi, "**$2**");
  out = out.replace(/<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi, "*$2*");
  out = out.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, c) => `[${stripHtml(String(c))}](${href})`);
  out = stripHtml(out);
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

function fmtIso(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

const originLabel = (v: string) => ORIGIN_OPTIONS.find((o) => o.value === v)?.label ?? v;

function noteToMarkdown(
  note: Note,
  categoryName: string | null,
  noteTagNames: string[],
): string {
  const kind = NOTE_KIND_MAP[note.kind]?.label ?? note.kind;
  const meta = note.metadata ?? {};
  const lines: string[] = [`# ${note.title || "Sem título"}`, ""];
  lines.push(`> Exportado do ${APP_NAME} em ${fmtIso(new Date())}`, "");
  lines.push(`- **Tipo:** ${kind}`);
  if (categoryName) lines.push(`- **Categoria:** ${categoryName}`);
  if (note.subcategory) lines.push(`- **Subcategoria:** ${note.subcategory}`);
  lines.push(`- **Conteúdo:** ${originLabel(note.origin)}`);
  if (note.source) lines.push(`- **Fonte / origem:** ${note.source}`);
  if (noteTagNames.length) lines.push(`- **Tags:** ${noteTagNames.map((t) => `#${t}`).join(" ")}`);
  lines.push(`- **Criado em:** ${fmtIso(note.createdAt)}`);
  lines.push(`- **Atualizado em:** ${fmtIso(note.updatedAt)}`);
  lines.push("");
  if (note.summary) {
    lines.push(`## Resumo`, "", note.summary, "");
  }
  if (meta.scientificName) lines.push(`- **Nome científico:** ${meta.scientificName}`, "");
  if (meta.purpose) lines.push(`## Finalidade (segundo a fonte)`, "", meta.purpose, "");
  if (meta.materials?.length) {
    lines.push("## Materiais", "");
    for (const m of meta.materials) lines.push(`- ${m}`);
    lines.push("");
  }
  if (meta.ingredients?.length) {
    lines.push("## Ingredientes ou materiais", "");
    for (const m of meta.ingredients) lines.push(`- ${m}`);
    lines.push("");
  }
  if (meta.preparation) lines.push(`## Modo de preparo anotado`, "", meta.preparation, "");
  if (meta.safetyNotes) lines.push(`## Avisos de segurança`, "", `> ${meta.safetyNotes}`, "");
  if (meta.entityType) lines.push(`- **Tipo de conteúdo:** ${meta.entityType}`, "");
  if (meta.lineage) lines.push(`- **Linha / agrupamento:** ${meta.lineage}`, "");
  if (meta.occasion) lines.push(`- **Ocasião:** ${meta.occasion}`, "");
  const body = htmlToMarkdown(note.content);
  if (body) lines.push("## Conteúdo", "", body, "");
  return lines.join("\n");
}

function entryToMarkdown(entry: DiaryEntry, entryTagNames: string[]): string {
  const lines: string[] = [`# ${entry.title || "Registro do diário"}`, ""];
  lines.push(`- **Data:** ${fmtIso(entry.entryDate)}`);
  if (entry.mood) lines.push(`- **Sentimento:** ${MOOD_LABELS[entry.mood] ?? entry.mood}`);
  if (entryTagNames.length) lines.push(`- **Tags:** ${entryTagNames.map((t) => `#${t}`).join(" ")}`);
  lines.push("");
  const body = htmlToMarkdown(entry.content);
  if (body) lines.push(body);
  return lines.join("\n");
}

/* -------------------------------- route -------------------------------- */

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const formato = url.searchParams.get("formato") ?? "json";
  const tipo = url.searchParams.get("tipo") ?? "tudo";
  const id = url.searchParams.get("id");

  const [allNotes, allEntries, cats, tagRows, nTags, dTags, rels, atts] = await Promise.all([
    db.select().from(notes).where(and(eq(notes.userId, user.id), isNull(notes.deletedAt))).orderBy(desc(notes.updatedAt)),
    db.select().from(diaryEntries).where(and(eq(diaryEntries.userId, user.id), isNull(diaryEntries.deletedAt))).orderBy(desc(diaryEntries.entryDate)),
    db.select().from(categories).where(eq(categories.userId, user.id)).orderBy(asc(categories.sortOrder)),
    db.select().from(tags).where(eq(tags.userId, user.id)),
    db.select().from(noteTags),
    db.select().from(diaryTags),
    db.select().from(noteRelations).where(eq(noteRelations.userId, user.id)),
    db.select().from(attachments).where(eq(attachments.userId, user.id)),
  ]);

  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const tagName = new Map(tagRows.map((t) => [t.id, t.name]));
  const tagsByNote = new Map<string, string[]>();
  for (const nt of nTags) {
    const name = tagName.get(nt.tagId);
    if (!name) continue;
    tagsByNote.set(nt.noteId, [...(tagsByNote.get(nt.noteId) ?? []), name]);
  }
  const tagsByEntry = new Map<string, string[]>();
  for (const dt of dTags) {
    const name = tagName.get(dt.tagId);
    if (!name) continue;
    tagsByEntry.set(dt.entryId, [...(tagsByEntry.get(dt.entryId) ?? []), name]);
  }

  /* --------------------------- markdown individual --------------------------- */

  if (formato === "md" && tipo === "nota" && id) {
    const note = allNotes.find((n) => n.id === id);
    if (!note) return NextResponse.json({ error: "Anotação não encontrada." }, { status: 404 });
    const md = noteToMarkdown(note, note.categoryId ? (catName.get(note.categoryId) ?? null) : null, tagsByNote.get(note.id) ?? []);
    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slugify(note.title)}.md"`,
      },
    });
  }

  if (formato === "md" && tipo === "diario" && id) {
    const entry = allEntries.find((e) => e.id === id);
    if (!entry) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    const md = entryToMarkdown(entry, tagsByEntry.get(entry.id) ?? []);
    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="diario-${slugify(entry.title)}.md"`,
      },
    });
  }

  /* ------------------------------ JSON completo ------------------------------ */

  if (formato === "json") {
    const payload = {
      aplicativo: APP_NAME,
      exportadoEm: new Date().toISOString(),
      conta: { nome: user.name, email: user.email },
      categorias: cats.map((c) => ({ id: c.id, nome: c.name, descricao: c.description, icone: c.icon, cor: c.color })),
      tags: tagRows.map((t) => t.name),
      anotacoes: allNotes.map((n) => ({
        id: n.id,
        tipo: n.kind,
        titulo: n.title,
        resumo: n.summary,
        conteudoHtml: n.content,
        conteudoTexto: n.contentText,
        categoria: n.categoryId ? (catName.get(n.categoryId) ?? null) : null,
        subcategoria: n.subcategory,
        origem: n.origin,
        fonte: n.source,
        metadados: n.metadata,
        favorito: n.favorite,
        fixado: n.pinned,
        criadoEm: n.createdAt.toISOString(),
        atualizadoEm: n.updatedAt.toISOString(),
        tags: tagsByNote.get(n.id) ?? [],
      })),
      diario: allEntries.map((e) => ({
        id: e.id,
        titulo: e.title,
        conteudoHtml: e.content,
        conteudoTexto: e.contentText,
        sentimento: e.mood,
        data: e.entryDate.toISOString(),
        favorito: e.favorite,
        tags: tagsByEntry.get(e.id) ?? [],
      })),
      relacionamentos: rels.map((r) => ({ de: r.fromNoteId, para: r.toNoteId })),
      arquivos: atts.map((a) => ({
        id: a.id,
        nome: a.fileName,
        tipo: a.mimeType,
        tamanho: a.size,
        descricao: a.description,
        anotacaoId: a.noteId,
        diarioId: a.diaryEntryId,
        enviadoEm: a.createdAt.toISOString(),
      })),
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="meu-axe-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }

  /* ------------------------------ ZIP (md e/ou pacote) ------------------------------ */

  const zip = new JSZip();
  const notesFolder = zip.folder("anotacoes");
  const diaryFolder = zip.folder("diario");
  const missing: string[] = [];

  for (const n of allNotes) {
    const kindLabel = NOTE_KIND_MAP[n.kind]?.label ?? n.kind;
    const md = noteToMarkdown(n, n.categoryId ? (catName.get(n.categoryId) ?? null) : null, tagsByNote.get(n.id) ?? []);
    notesFolder?.file(`${slugify(kindLabel)}/${slugify(n.title)}-${n.id.slice(0, 8)}.md`, md);
  }
  for (const e of allEntries) {
    diaryFolder?.file(
      `${e.entryDate.toISOString().slice(0, 10)}-${slugify(e.title) || "registro"}-${e.id.slice(0, 8)}.md`,
      entryToMarkdown(e, tagsByEntry.get(e.id) ?? []),
    );
  }

  if (formato === "zip") {
    const filesFolder = zip.folder("arquivos");
    for (const a of atts) {
      const buffer = await readFileBuffer(a.storedName);
      if (buffer) {
        filesFolder?.file(`${a.id.slice(0, 8)}-${a.fileName.replace(/[<>:"|?*]/g, "_")}`, buffer);
      } else {
        missing.push(a.fileName);
      }
    }
    zip.file(
      "dados.json",
      JSON.stringify(
        {
          aplicativo: APP_NAME,
          exportadoEm: new Date().toISOString(),
          categorias: cats.map((c) => ({ nome: c.name, icone: c.icon, cor: c.color })),
          relacionamentos: rels.map((r) => ({ de: r.fromNoteId, para: r.toNoteId })),
        },
        null,
        2,
      ),
    );
  }

  const readme = [
    `${APP_NAME} — exportação`,
    `Gerado em ${fmtIso(new Date())} para ${user.name}.`,
    ``,
    `Conteúdo: ${allNotes.length} anotações em Markdown (pasta "anotacoes"), ${allEntries.length} registros do diário (pasta "diario")${formato === "zip" ? ` e ${atts.length - missing.length} anexos (pasta "arquivos")` : ""}.`,
    missing.length
      ? `\nAtenção: estes anexos não puderam ser incluídos (arquivo não encontrado no armazenamento):\n${missing.map((m) => `- ${m}`).join("\n")}`
      : formato === "zip"
        ? `\nTodos os anexos foram incluídos.`
        : "",
  ].join("\n");
  zip.file("LEIAME.txt", readme);

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const name = formato === "zip" ? `meu-axe-completo` : `meu-axe-markdown`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.zip"`,
    },
  });
}
