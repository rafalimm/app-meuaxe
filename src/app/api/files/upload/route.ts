import { NextResponse } from "next/server";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attachments, diaryEntries, notes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { FILE_RULES } from "@/lib/constants";
import { randomStoredName, saveFile } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "arquivo";
  return base.replace(/[\r\n"<>|?*]/g, "").trim().slice(0, 200) || "arquivo";
}

function magicOk(mime: string, buf: Buffer): boolean {
  if (buf.length < 5) return false;
  if (mime === "application/pdf") return buf.subarray(0, 4).toString("latin1") === "%PDF";
  if (mime === "image/png")
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  if (mime === "image/jpeg") return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === "image/webp")
    return buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP";
  return true; // textos
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Você precisa entrar na sua conta." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Envio inválido." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "Nenhum arquivo recebido." }, { status: 400 });
  }

  const purpose = String(form.get("purpose") ?? "library").slice(0, 20);
  const noteId = String(form.get("noteId") ?? "").trim() || null;
  const diaryEntryId = String(form.get("diaryEntryId") ?? "").trim() || null;

  const fileName = sanitizeFileName(file.name || "arquivo");
  const ext = path.extname(fileName).toLowerCase();
  const mime = (file.type || "application/octet-stream").toLowerCase();

  const rule = FILE_RULES.find(
    (r) => r.ext.includes(ext) && (r.mime.includes(mime) || mime === ""),
  );
  if (!rule) {
    return NextResponse.json(
      { ok: false, error: "Tipo de arquivo não permitido. Envie PDF, imagens (JPG, PNG, WebP) ou textos (.txt, .md)." },
      { status: 400 },
    );
  }
  if (file.size > rule.max) {
    return NextResponse.json(
      { ok: false, error: `Arquivo acima do limite permitido (${rule.label}).` },
      { status: 413 },
    );
  }

  if (["avatar", "cover", "inline"].includes(purpose) && !mime.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "Envie uma imagem (JPG, PNG ou WebP)." }, { status: 400 });
  }

  // valida vínculos
  if (noteId) {
    const n = await db
      .select({ id: notes.id })
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .limit(1);
    if (!n[0]) return NextResponse.json({ ok: false, error: "Anotação não encontrada." }, { status: 404 });
  }
  if (diaryEntryId) {
    const d = await db
      .select({ id: diaryEntries.id })
      .from(diaryEntries)
      .where(and(eq(diaryEntries.id, diaryEntryId), eq(diaryEntries.userId, user.id)))
      .limit(1);
    if (!d[0]) return NextResponse.json({ ok: false, error: "Entrada do diário não encontrada." }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!magicOk(mime, buffer)) {
    return NextResponse.json(
      { ok: false, error: "O conteúdo do arquivo não corresponde ao tipo informado." },
      { status: 400 },
    );
  }

  const storedName = randomStoredName(ext);
  await saveFile(storedName, buffer);

  const [row] = await db
    .insert(attachments)
    .values({
      userId: user.id,
      noteId,
      diaryEntryId,
      fileName,
      storedName,
      mimeType: mime,
      size: file.size,
      purpose,
    })
    .returning();

  return NextResponse.json({
    ok: true,
    id: row.id,
    file: {
      id: row.id,
      fileName: row.fileName,
      mimeType: row.mimeType,
      size: row.size,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
      noteId: row.noteId,
      diaryEntryId: row.diaryEntryId,
    },
  });
}
