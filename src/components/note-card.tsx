"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  MoreHorizontal,
  Pin,
  PinOff,
  Star,
  Trash2,
  Clock,
  RotateCcw,
} from "lucide-react";
import { cn, fmtDate, truncate } from "@/lib/utils";
import { NOTE_KIND_MAP } from "@/lib/constants";
import type { NoteListItem } from "@/lib/queries";
import { toggleFavorite, togglePin, duplicateNote, moveNoteToTrash, restoreNote, deleteNoteForever } from "@/app/actions/notes";
import { useToast } from "./toast";
import { ConfirmDialog } from "./dialog";

export function KindChip({ kind, className }: { kind: string; className?: string }) {
  const def = NOTE_KIND_MAP[kind] ?? NOTE_KIND_MAP.note;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white",
        className,
      )}
      style={{ backgroundColor: def.color }}
    >
      {def.label}
    </span>
  );
}

export function NoteCard({
  note,
  trash = false,
}: {
  note: NoteListItem;
  trash?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [fav, setFav] = useState(note.favorite);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function run(fn: () => Promise<{ ok?: boolean; error?: string; id?: string }>, opts?: { onOk?: (r: { ok?: boolean; error?: string; id?: string }) => void; okMsg?: string }) {
    startTransition(async () => {
      try {
        const res = await fn();
        if (res.error) {
          toast.error(res.error);
          return;
        }
        if (opts?.okMsg) toast.success(opts.okMsg);
        opts?.onOk?.(res);
        router.refresh();
      } catch {
        toast.error("Falha de conexão. Tente novamente.");
      }
    });
  }

  const title = note.title.trim() || "Sem título";

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card transition-all duration-200",
        !trash && "hover:-translate-y-0.5 hover:border-line-2 hover:shadow-lift",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <KindChip kind={note.kind} />
        <div className="flex items-center gap-0.5">
          {note.pinned && !trash && <Pin className="size-3.5 text-gold-deep dark:text-gold" />}
          {!trash && (
            <button
              type="button"
              aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              aria-pressed={fav}
              onClick={() => {
                const next = !fav;
                setFav(next);
                run(() => toggleFavorite(note.id, next), {
                  onOk: (r) => {
                    if (r.error) setFav(!next);
                  },
                });
              }}
              className={cn(
                "rounded-lg p-1.5 transition cursor-pointer",
                fav ? "text-gold-deep dark:text-gold" : "text-ink-3 opacity-0 hover:text-gold-deep group-hover:opacity-100 focus-visible:opacity-100",
              )}
            >
              <Star className={cn("size-4", fav && "fill-current")} />
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              aria-label="Opções do registro"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg p-1.5 text-ink-3 opacity-0 transition hover:bg-surface-2 hover:text-ink group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
            >
              <MoreHorizontal className="size-4" />
            </button>
            {menuOpen && (
              <>
                <button aria-hidden tabIndex={-1} className="fixed inset-0 z-20 cursor-default" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-30 w-48 overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-pop">
                  {trash ? (
                    <>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-ink hover:bg-surface-2 cursor-pointer"
                        onClick={() => {
                          setMenuOpen(false);
                          run(() => restoreNote(note.id), { okMsg: "Registro restaurado." });
                        }}
                      >
                        <RotateCcw className="size-4" /> Restaurar
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-danger hover:bg-danger-soft dark:hover:bg-[#40201a] cursor-pointer"
                        onClick={() => {
                          setMenuOpen(false);
                          setConfirmDelete(true);
                        }}
                      >
                        <Trash2 className="size-4" /> Excluir permanentemente
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/caderno/${note.id}`}
                        className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-ink hover:bg-surface-2"
                      >
                        Abrir
                      </Link>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-ink hover:bg-surface-2 cursor-pointer"
                        onClick={() => {
                          setMenuOpen(false);
                          run(() => togglePin(note.id, !note.pinned), {
                            okMsg: note.pinned ? "Registro desafixado." : "Registro fixado no topo.",
                          });
                        }}
                      >
                        {note.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                        {note.pinned ? "Desafixar" : "Fixar no topo"}
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-ink hover:bg-surface-2 cursor-pointer"
                        onClick={() => {
                          setMenuOpen(false);
                          run(() => duplicateNote(note.id), {
                            okMsg: "Duplicado criado.",
                            onOk: (r) => {
                              if (r.id) router.push(`/caderno/${r.id}`);
                            },
                          });
                        }}
                      >
                        <Copy className="size-4" /> Duplicar
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-danger hover:bg-danger-soft dark:hover:bg-[#40201a] cursor-pointer"
                        onClick={() => {
                          setMenuOpen(false);
                          setConfirmTrash(true);
                        }}
                      >
                        <Trash2 className="size-4" /> Mover para a lixeira
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Link href={trash ? "#" : `/caderno/${note.id}`} className={cn("mt-2.5 block", trash && "pointer-events-none")}>
        <h3 className="font-display text-[1.05rem] font-semibold leading-snug text-ink">
          {truncate(title, 90)}
        </h3>
        {note.excerpt && (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-2">
            {truncate(note.excerpt, 180)}
          </p>
        )}
      </Link>

      {note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {note.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-2">
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
        {note.categoryName ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
            <span className="size-2 rounded-full" style={{ backgroundColor: note.categoryColor ?? "#A8B9A1" }} />
            {note.categoryName}
          </span>
        ) : (
          <span className="text-xs text-ink-3">Sem categoria</span>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-3">
          <Clock className="size-3" /> {fmtDate(note.updatedAt)}
        </span>
      </div>

      <ConfirmDialog
        open={confirmTrash}
        onCancel={() => setConfirmTrash(false)}
        onConfirm={() => {
          setConfirmTrash(false);
          run(() => moveNoteToTrash(note.id), { okMsg: "Movido para a lixeira." });
        }}
        loading={pending}
        title="Mover para a lixeira"
        description={`"${title}" ficará na lixeira por 30 dias e poderá ser restaurado. Depois disso, será excluído permanentemente.`}
        confirmLabel="Mover para a lixeira"
      />
      <ConfirmDialog
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          run(() => deleteNoteForever(note.id), { okMsg: "Registro excluído permanentemente." });
        }}
        loading={pending}
        danger
        title="Excluir permanentemente"
        description={`"${title}" será excluído para sempre, junto com seus anexos. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir permanentemente"
      />
    </article>
  );
}
