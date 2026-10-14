import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attachments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { readFileBuffer } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Servimento privado de arquivos: exige sessão e propriedade do arquivo.
 * A URL só é válida dentro da sessão autenticada do usuário.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(attachments)
    .where(and(eq(attachments.id, id), eq(attachments.userId, user.id)))
    .limit(1);
  const file = rows[0];
  if (!file) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  const buffer = await readFileBuffer(file.storedName);
  if (!buffer) {
    return NextResponse.json(
      { error: "O arquivo não está disponível no armazenamento." },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  const viewable =
    file.mimeType.startsWith("image/") ||
    file.mimeType === "application/pdf" ||
    file.mimeType.startsWith("text/");
  const dispositionType = download || !viewable ? "attachment" : "inline";
  const safeName = file.fileName.replace(/[^\w.\- áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]/g, "_");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(buffer.length),
      "Content-Disposition": `${dispositionType}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
      "Content-Security-Policy": "sandbox; default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
