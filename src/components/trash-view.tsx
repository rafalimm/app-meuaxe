"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Feather, Info, RotateCcw, Trash2 } from "lucide-react";
import { fmtDate } from "@/lib/utils";
import { TRASH_RETENTION_DAYS } from "@/lib/constants";
import type { NoteListItem, DiaryListItem } from "@/lib/queries";
import { restoreNote, deleteNoteForever } from "@/app/actions/notes";
import { restoreEntry, deleteEntryForever } from "@/app/actions/diary";
import { emptyTrash } from "@/app/actions/trash";
import { NoteCard } from "./note-card";
import { EmptyState } from "./empty-state";
import { ConfirmDialog } from "./dialog";
import { Button } from "./ui";
import { useToast } from "./toast";

export function TrashView({
  notes,
  diary,
}: {
  notes: NoteListItem[];
  diary: DiaryListItem[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [removing, setRemoving] = useState<DiaryListItem | null>(null);

  const total = notes.length + diary.length;

  if (total === 0) {
    return (
      <EmptyState
        icon={Trash2}
        title="Lixeira vazia"
        description={`Itens excluídos ficam aqui por ${TRASH_RETENTION_DAYS} dias antes de serem apagados definitivamente. Você pode restaurá-los a qualquer momento dentro desse prazo.`}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-warning/35 bg-warning-soft p-4 dark:bg-[#33270f] sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
          <Info className="mt-0.5 size-4 shrink-0 text-warning" />
          Os itens ficam na lixeira por {TRASH_RETENTION_DAYS} dias e depois são excluídos
          automaticamente de forma permanente.
        </p>
        <Button variant="danger" size="sm" onClick={() => setConfirmEmpty(true)}>
          Esvaziar lixeira
        </Button>
      </div>

      {notes.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">
            Anotações e estudos ({notes.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {notes.map((n) => (
              <NoteCard key={n.id} note={n} trash />
            ))}
          </div>
        </section>
      )}

      {diary.length > 0 && (
        <section>
          <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <Feather className="size-4.5 text-ink-3" /> Diário espiritual ({diary.length})
          </h2>
          <div className="space-y-2.5">
            {diary.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-card"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{e.title || "Registro sem título"}</p>
                  <p className="text-xs text-ink-3">
                    {fmtDate(e.entryDate)} · excluído, pendente de exclusão definitiva
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await restoreEntry(e.id);
                      if (res.error) toast.error(res.error);
                      else toast.success("Registro restaurado.");
                      router.refresh();
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2 cursor-pointer disabled:opacity-60"
                >
                  <RotateCcw className="size-4" /> Restaurar
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setRemoving(e)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-danger/40 px-3 py-2 text-sm font-medium text-danger hover:bg-danger-soft cursor-pointer disabled:opacity-60 dark:hover:bg-[#40201a]"
                >
                  <Trash2 className="size-4" /> Excluir
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirmEmpty}
        onCancel={() => setConfirmEmpty(false)}
        onConfirm={() => {
          setConfirmEmpty(false);
          startTransition(async () => {
            const res = await emptyTrash();
            if (res.error) toast.error(res.error);
            else toast.success(`${res.purged} ${res.purged === 1 ? "item excluído" : "itens excluídos"} permanentemente.`);
            router.refresh();
          });
        }}
        loading={pending}
        danger
        title="Esvaziar a lixeira"
        description={`Todos os ${total} itens da lixeira (e seus anexos) serão excluídos permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Esvaziar permanentemente"
      />

      <ConfirmDialog
        open={!!removing}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          const target = removing;
          setRemoving(null);
          if (!target) return;
          startTransition(async () => {
            const res = await deleteEntryForever(target.id);
            if (res.error) toast.error(res.error);
            else toast.success("Excluído permanentemente.");
            router.refresh();
          });
        }}
        loading={pending}
        danger
        title="Excluir permanentemente"
        description={`"${removing?.title || "Registro sem título"}" será excluído para sempre. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir permanentemente"
      />
    </div>
  );
}
