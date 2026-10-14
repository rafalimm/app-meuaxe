import type { LucideIcon } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listNotes, categoriesWithCounts } from "@/lib/queries";
import { PageTitle, Card } from "@/components/ui";
import { FilterBar } from "@/components/filter-bar";
import { NoteCard } from "@/components/note-card";
import { EmptyState } from "@/components/empty-state";
import { NewNoteButton } from "@/components/new-record";

export async function StudyAreaView({
  title,
  description,
  kinds,
  addKind,
  addLabel,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
  notice,
  searchParams,
}: {
  title: string;
  description: string;
  kinds: string[];
  addKind: string;
  addLabel: string;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  notice?: { title: string; text: string };
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireUser();

  const q = typeof sp.q === "string" ? sp.q : "";
  const categoria = typeof sp.categoria === "string" ? sp.categoria : "";
  const fav = sp.fav === "1";
  const ordem = typeof sp.ordem === "string" ? sp.ordem : "atualizacao";

  const [items, cats] = await Promise.all([
    listNotes(user.id, {
      kinds,
      q: q || undefined,
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
      <PageTitle title={title} description={description} action={<NewNoteButton kind={addKind} label={addLabel} />} />

      {notice && (
        <Card className="border-gold/35 bg-gold-soft/50 p-4 dark:bg-[#2c2818]">
          <p className="text-sm font-semibold text-gold-deep dark:text-gold">{notice.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">{notice.text}</p>
        </Card>
      )}

      <FilterBar categories={cats.map((c) => ({ id: c.id, name: c.name }))} basePath="" />

      {sorted.length === 0 ? (
        <EmptyState
          icon={EmptyIcon}
          title={q || categoria || fav ? "Nada encontrado com esses filtros" : emptyTitle}
          description={q || categoria || fav ? "Tente ajustar a pesquisa ou limpar os filtros." : emptyDescription}
          action={<NewNoteButton kind={addKind} label={addLabel} />}
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
