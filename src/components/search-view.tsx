"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Feather,
  FileText,
  Loader2,
  Search,
  SearchX,
  Star,
} from "lucide-react";
import { cn, fmtDate, formatBytes } from "@/lib/utils";
import { NOTE_KINDS } from "@/lib/constants";
import { globalSearch, type GlobalSearchResult } from "@/app/actions/search";
import { Highlight } from "./highlight";
import { KindChip } from "./note-card";

export function SearchView({
  initialQ,
  categories,
}: {
  initialQ: string;
  categories: Array<{ id: string; name: string }>;
}) {
  const [q, setQ] = useState(initialQ);
  const [kind, setKind] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<"updated" | "recent" | "oldest" | "alpha">("updated");
  const [result, setResult] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const runRef = useRef(0);

  const run = useCallback(async () => {
    const id = ++runRef.current;
    if (!q.trim() && !favorite && !tag.trim()) {
      setResult(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await globalSearch({
        q: q.trim(),
        kind,
        categoryId,
        favorite,
        from,
        to,
        tag: tag.trim(),
        sort,
        includeDiary: true,
        includeFiles: true,
      });
      if (id === runRef.current) {
        setResult(res);
        setLoading(false);
      }
    } catch {
      if (id === runRef.current) {
        setError(true);
        setLoading(false);
      }
    }
  }, [q, kind, categoryId, favorite, from, to, tag, sort]);

  useEffect(() => {
    const handle = window.setTimeout(() => void run(), 420);
    return () => window.clearTimeout(handle);
  }, [run]);

  const selectCls =
    "rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink cursor-pointer hover:border-line-2 focus:border-gold focus:outline-none";

  return (
    <div className="space-y-5">
      {/* caixa de pesquisa */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-ink-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar em títulos, conteúdos, tags, referências e arquivos…"
            aria-label="Termo de pesquisa"
            autoFocus
            className="w-full rounded-xl border border-line bg-bg py-3 pl-11 pr-10 text-[0.95rem] text-ink placeholder:text-ink-3 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          />
          {loading && <Loader2 className="absolute right-3.5 top-1/2 size-5 -translate-y-1/2 animate-spin text-ink-3" />}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <select aria-label="Tipo de conteúdo" className={selectCls} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">Todos os tipos</option>
            {NOTE_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.plural}
              </option>
            ))}
          </select>
          <select aria-label="Categoria" className={selectCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Todas as categorias</option>
            <option value="none">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            aria-label="Tag"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Tag exata"
            className={selectCls}
          />
          <input
            aria-label="De (data inicial)"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={selectCls}
          />
          <input
            aria-label="Até (data final)"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={selectCls}
          />
          <select aria-label="Ordenar por" className={selectCls} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="updated">Última atualização</option>
            <option value="recent">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="alpha">Ordem alfabética</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setFavorite((v) => !v)}
          aria-pressed={favorite}
          className={cn(
            "mt-2.5 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition cursor-pointer",
            favorite
              ? "border-gold/50 bg-gold-soft text-gold-deep dark:bg-[#3a3320] dark:text-gold"
              : "border-line bg-surface text-ink-2 hover:text-ink",
          )}
        >
          <Star className={cn("size-4", favorite && "fill-current")} /> Somente favoritos
        </button>
      </div>

      {/* resultados */}
      {error && (
        <div role="alert" className="rounded-2xl border border-danger/25 bg-danger-soft px-4 py-5 text-center text-sm text-danger dark:bg-[#40201a]">
          Não foi possível pesquisar agora. Verifique sua conexão e tente novamente.
        </div>
      )}

      {!error && result === null && !loading && (
        <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-3">
          Digite um termo ou use os filtros para pesquisar em todo o seu conteúdo pessoal.
        </p>
      )}

      {!error && result !== null && result.total === 0 && !loading && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-4 py-12 text-center">
          <SearchX className="size-8 text-ink-3" />
          <p className="mt-3 font-display text-lg font-semibold text-ink">Nenhum resultado</p>
          <p className="mt-1 max-w-sm text-sm text-ink-2">
            Nada encontrado para os filtros atuais. Verifique a ortografia ou tente termos mais amplos.
          </p>
        </div>
      )}

      {result && result.total > 0 && (
        <div className="space-y-8">
          <p className="text-sm text-ink-2" role="status">
            {result.total} {result.total === 1 ? "resultado encontrado" : "resultados encontrados"}
          </p>

          {result.notes.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">
                Anotações e estudos ({result.notes.length})
              </h2>
              <div className="space-y-2.5">
                {result.notes.map((n) => (
                  <Link
                    key={n.id}
                    href={`/caderno/${n.id}`}
                    className="group flex items-start gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:border-sage hover:shadow-lift"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <KindChip kind={n.kind} />
                        {n.favorite && <Star className="size-3.5 fill-gold text-gold" />}
                        {n.categoryName && (
                          <span className="text-xs text-ink-3">{n.categoryName}</span>
                        )}
                        <span className="text-xs text-ink-3">{fmtDate(n.updatedAt)}</span>
                      </div>
                      <h3 className="mt-1.5 font-display text-[1.02rem] font-semibold text-ink">
                        <Highlight text={n.title || "Sem título"} term={q} />
                      </h3>
                      {n.excerpt && (
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-2">
                          <Highlight text={n.excerpt} term={q} />
                        </p>
                      )}
                      {n.tags.length > 0 && (
                        <p className="mt-1.5 text-xs text-ink-3">
                          {n.tags.map((t) => `#${t}`).join("  ")}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-ink-3 transition group-hover:translate-x-0.5 group-hover:text-forest" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {result.diary.length > 0 && (
            <section>
              <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <Feather className="size-4.5 text-ink-3" /> Diário espiritual ({result.diary.length})
              </h2>
              <div className="space-y-2.5">
                {result.diary.map((d) => (
                  <Link
                    key={d.id}
                    href={`/diario/${d.id}`}
                    className="group flex items-start gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:border-sage hover:shadow-lift"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-ink-3">{fmtDate(d.entryDate)}</span>
                      <h3 className="mt-0.5 font-display text-[1.02rem] font-semibold text-ink">
                        <Highlight text={d.title || "Registro sem título"} term={q} />
                      </h3>
                      {d.excerpt && (
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-2">
                          <Highlight text={d.excerpt} term={q} />
                        </p>
                      )}
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-ink-3 transition group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {result.files.length > 0 && (
            <section>
              <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <FileText className="size-4.5 text-ink-3" /> Arquivos ({result.files.length})
              </h2>
              <div className="space-y-2.5">
                {result.files.map((f) => (
                  <a
                    key={f.id}
                    href={`/api/files/${f.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:border-sage hover:shadow-lift"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-2">
                      <FileText className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        <Highlight text={f.fileName} term={q} />
                      </p>
                      <p className="truncate text-xs text-ink-3">
                        {formatBytes(f.size)} · {fmtDate(f.createdAt)}
                        {f.description && (
                          <>
                            {" · "}
                            <Highlight text={f.description} term={q} />
                          </>
                        )}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
