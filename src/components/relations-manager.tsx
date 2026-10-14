"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Link2, Loader2, Plus, X } from "lucide-react";
import { NOTE_KIND_MAP } from "@/lib/constants";
import {
  addRelation,
  getRelations,
  removeRelation,
  searchLinkableNotes,
} from "@/app/actions/notes";
import { useToast } from "./toast";

export interface RelationItem {
  id: string;
  toId: string;
  title: string;
  kind: string;
}

export function RelationsManager({
  noteId,
  initial,
}: {
  noteId: string;
  initial: RelationItem[];
}) {
  const toast = useToast();
  const [relations, setRelations] = useState<RelationItem[]>(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: string; title: string; kind: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      setSearching(true);
      try {
        const rows = await searchLinkableNotes(query, noteId);
        const linked = new Set(relations.map((r) => r.toId));
        setResults(rows.filter((r) => !linked.has(r.id)));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, noteId, relations]);

  function add(toId: string) {
    startTransition(async () => {
      const res = await addRelation(noteId, toId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const fresh = await getRelations(noteId);
      setRelations(fresh);
      setQuery("");
    });
  }

  function remove(relationId: string) {
    startTransition(async () => {
      const res = await removeRelation(relationId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setRelations((prev) => prev.filter((r) => r.id !== relationId));
    });
  }

  return (
    <div className="space-y-3">
      {relations.length > 0 ? (
        <ul className="space-y-2">
          {relations.map((r) => {
            const def = NOTE_KIND_MAP[r.kind] ?? NOTE_KIND_MAP.note;
            return (
              <li
                key={r.id}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5"
              >
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: def.color }} />
                <Link
                  href={`/caderno/${r.toId}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium text-ink hover:text-forest"
                >
                  {r.title}
                </Link>
                <span className="text-xs text-ink-3">{def.label}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(r.id)}
                  aria-label={`Remover relação com ${r.title}`}
                  className="rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-danger cursor-pointer disabled:opacity-50"
                >
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-ink-3">
          Nenhum registro relacionado. Conecte esta anotação a estudos, ervas ou documentos do seu caderno.
        </p>
      )}

      <div className="relative">
        <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar registro para relacionar…"
          aria-label="Buscar registro para relacionar"
          className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-9 text-sm text-ink placeholder:text-ink-3 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-3" />}
        {query.length > 0 && results.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-line bg-surface shadow-pop animate-pop">
            {results.map((r) => {
              const def = NOTE_KIND_MAP[r.kind] ?? NOTE_KIND_MAP.note;
              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={pending}
                  onClick={() => add(r.id)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink hover:bg-surface-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: def.color }} />
                  <span className="min-w-0 flex-1 truncate">{r.title}</span>
                  <Plus className="size-4 text-ink-3" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
