"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { restoreNote, deleteNoteForever } from "@/app/actions/notes";
import { restoreEntry, deleteEntryForever } from "@/app/actions/diary";
import { useToast } from "./toast";
import { ConfirmDialog } from "./dialog";
import { useState } from "react";

export function TrashedNotice({
  id,
  type,
  title,
  backHref,
}: {
  id: string;
  type: "note" | "diary";
  title: string;
  backHref: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="mx-auto max-w-lg pt-10 text-center">
      <div className="rounded-3xl border border-line bg-surface p-8 shadow-card">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-danger-soft text-danger dark:bg-[#40201a]">
          <Trash2 className="size-6" />
        </span>
        <h1 className="mt-4 font-display text-xl font-semibold text-ink">Este registro está na lixeira</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          “{title}” foi movido para a lixeira. Restaure para continuar editando ou exclua
          permanentemente.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = type === "note" ? await restoreNote(id) : await restoreEntry(id);
                if (res.error) {
                  toast.error(res.error);
                  return;
                }
                toast.success("Registro restaurado.");
                router.push(type === "note" ? `/caderno/${id}` : `/diario/${id}`);
                router.refresh();
              })
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-medium text-on-forest hover:bg-forest-bright cursor-pointer disabled:opacity-60"
          >
            <RotateCcw className="size-4" /> Restaurar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-danger/40 px-5 py-2.5 text-sm font-medium text-danger hover:bg-danger-soft cursor-pointer disabled:opacity-60 dark:hover:bg-[#40201a]"
          >
            <Trash2 className="size-4" /> Excluir permanentemente
          </button>
        </div>
        <Link
          href={backHref}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Voltar
        </Link>
      </div>
      <ConfirmDialog
        open={confirm}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          startTransition(async () => {
            const res = type === "note" ? await deleteNoteForever(id) : await deleteEntryForever(id);
            if (res.error) {
              toast.error(res.error);
              return;
            }
            toast.success("Excluído permanentemente.");
            router.push("/lixeira");
            router.refresh();
          });
        }}
        loading={pending}
        danger
        title="Excluir permanentemente"
        description="Esta ação não pode ser desfeita. O registro e seus anexos serão excluídos para sempre."
        confirmLabel="Excluir permanentemente"
      />
    </div>
  );
}
