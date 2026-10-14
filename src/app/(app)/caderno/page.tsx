import type { Metadata } from "next";
import { NotebookPen } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listNotes, categoriesWithCounts } from "@/lib/queries";
import { PageTitle } from "@/components/ui";
import { FilterBar } from "@/components/filter-bar";
import { NoteCard } from "@/components/note-card";
import { EmptyState } from "@/components/empty-state";
import { NewNoteButton } from "@/components/new-record";

export const metadata: Metadata = { title: "Meu Caderno" };

type Ordem = "atualizacao" | "recentes" | "antigos" | "az";

export default async function CadernoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireUser();

  const q = typeof sp.q === "string" ? sp.q : "";
  const tipo = typeof sp.tipo === "string" ? sp.tipo : "";
  const categoria = typeof sp.categoria === "string" ? sp.categoria : "";
  const fav = sp.fav === "1";
  const ordem = (typeof sp.ordem === "string" ? sp.ordem : "atualizacao") as Ordem;

  const [items, cats] = await Promise.all([
    listNotes(user.id, {
      q: q || undefined,
      kinds: tipo ? [tipo] : undefined,
      categoryId: categoria || undefined,
      favorite: fav || undefined,
    }),
    categoriesWithCounts(user.id),
  ]);

  const sorted = [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (ordem === "az") return (a.title || "Sem título").localeCompare(b.title || "Sem título", "pt-BR");
    if (ordem === "recentes") return b.createdAt.localeCompare(a.createdAt);
    if (ordem === "antigos") return a.createdAt.localeCompare(b.createdAt);
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  return (
    <div className="space-y-6">
      <PageTitle
        title="Meu Caderno"
        description="Tudo o que você aprende, em um só lugar: anotações, fundamentos, ervas, banhos, pratos, entidades e estudos."
        action={<NewNoteButton />}
      />

      <FilterBar categories={cats.map((c) => ({ id: c.id, name: c.name }))} showKind basePath="/caderno" />

      {sorted.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title={q || tipo || categoria || fav ? "Nada encontrado com esses filtros" : "Seu caderno ainda está vazio"}
          description={
            q || tipo || categoria || fav
              ? "Tente ajustar a pesquisa ou limpar os filtros."
              : "Crie sua primeira anotação e comece a registrar o que aprende. Não precisa preencher tudo — salve rápido e complete depois."
          }
          action={<NewNoteButton label="Criar anotação" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}
    </div>
  );
}
