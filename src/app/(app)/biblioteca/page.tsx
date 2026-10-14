import type { Metadata } from "next";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { attachments } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { PageTitle } from "@/components/ui";
import { LibraryView } from "@/components/library-view";

export const metadata: Metadata = { title: "Biblioteca de Arquivos" };

export default async function BibliotecaPage() {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(attachments)
    .where(and(eq(attachments.userId, user.id), ne(attachments.purpose, "inline")))
    .orderBy(desc(attachments.createdAt))
    .limit(500);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Biblioteca de Arquivos"
        description="Seus materiais de estudo — PDFs, imagens e documentos — com acesso privado, visualização segura e organização por descrição."
      />
      <LibraryView
        files={rows.map((a) => ({
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
    </div>
  );
}
