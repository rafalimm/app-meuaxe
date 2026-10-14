"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Star, ArrowUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOTE_KINDS } from "@/lib/constants";

export function FilterBar({
  categories,
  showKind = false,
  basePath,
}: {
  categories: Array<{ id: string; name: string }>;
  showKind?: boolean;
  basePath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const resolvedBase = basePath || pathname;
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [searching, setSearching] = useState(false);

  const current = {
    categoria: params.get("categoria") ?? "",
    tipo: params.get("tipo") ?? "",
    fav: params.get("fav") === "1",
    ordem: params.get("ordem") ?? "atualizacao",
  };

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  function push(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) sp.set(key, value);
      else sp.delete(key);
    }
    startTransition(() => {
      router.push(`${resolvedBase}?${sp.toString()}`);
    });
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const currentQ = new URLSearchParams(window.location.search).get("q") ?? "";
      if (q !== currentQ) {
        setSearching(true);
        const sp = new URLSearchParams(window.location.search);
        if (q) sp.set("q", q);
        else sp.delete("q");
        startTransition(() => {
          router.push(`${resolvedBase}?${sp.toString()}`);
          window.setTimeout(() => setSearching(false), 500);
        });
      }
    }, 450);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const selectCls =
    "rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink cursor-pointer hover:border-line-2 focus:border-gold focus:outline-none";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar nesta área…"
          aria-label="Pesquisar nesta área"
          className="w-full rounded-xl border border-line bg-surface py-2 pl-9 pr-8 text-sm text-ink placeholder:text-ink-3 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
        />
        {searching && <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-3" />}
      </div>

      {showKind && (
        <select
          aria-label="Filtrar por tipo"
          className={selectCls}
          value={current.tipo}
          onChange={(e) => push({ tipo: e.target.value })}
        >
          <option value="">Todos os tipos</option>
          {NOTE_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.plural}
            </option>
          ))}
        </select>
      )}

      <select
        aria-label="Filtrar por categoria"
        className={selectCls}
        value={current.categoria}
        onChange={(e) => push({ categoria: e.target.value })}
      >
        <option value="">Todas as categorias</option>
        <option value="none">Sem categoria</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Ordenar"
        className={selectCls}
        value={current.ordem}
        onChange={(e) => push({ ordem: e.target.value })}
      >
        <option value="atualizacao">Última atualização</option>
        <option value="recentes">Mais recentes</option>
        <option value="antigos">Mais antigos</option>
        <option value="az">A a Z</option>
      </select>

      <button
        type="button"
        onClick={() => push({ fav: current.fav ? "" : "1" })}
        aria-pressed={current.fav}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition cursor-pointer",
          current.fav
            ? "border-gold/50 bg-gold-soft text-gold-deep dark:bg-[#3a3320] dark:text-gold"
            : "border-line bg-surface text-ink-2 hover:text-ink",
        )}
      >
        {current.fav ? <Star className="size-4 fill-current" /> : <Star className="size-4" />}
        Favoritos
      </button>

      <ArrowUpDown className="hidden size-4 text-ink-3 sm:block" aria-hidden="true" />
    </div>
  );
}
