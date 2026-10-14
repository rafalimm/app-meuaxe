import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { categoriesWithCounts } from "@/lib/queries";
import { PageTitle } from "@/components/ui";
import { SearchView } from "@/components/search-view";

export const metadata: Metadata = { title: "Pesquisa Global" };

export default async function PesquisaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireUser();
  const cats = await categoriesWithCounts(user.id);
  const q = typeof sp.q === "string" ? sp.q : "";

  return (
    <div className="space-y-6">
      <PageTitle
        title="Pesquisa Global"
        description="Encontre qualquer anotação, estudo, entrada do diário ou arquivo da sua conta — com filtros por tipo, categoria, período, favoritos e tags."
      />
      {/* key por termo para reiniciar o estado quando vier novo q pela URL */}
      <SearchView key={q} initialQ={q} categories={cats.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
