"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthState } from "@/app/actions/auth";
import {
  createCategory,
  deleteCategory,
  reorderCategories,
  updateCategory,
} from "@/app/actions/categories";
import { Button, Field, Input, Textarea, Select } from "./ui";
import { Modal } from "./dialog";
import { useToast } from "./toast";
import { NamedIcon, ICON_OPTIONS } from "./icon";

const COLORS = [
  "#173D30",
  "#1F5443",
  "#3E6B4F",
  "#3A6B7A",
  "#8A5A2B",
  "#7A5636",
  "#6B5A8A",
  "#B07A1F",
  "#4F6B8A",
  "#5E6B3F",
  "#5A6B62",
  "#8A3B4C",
];

export interface CategoryRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  noteCount: number;
}

export function CategoriesManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const [reassign, setReassign] = useState<string>("none");

  function move(index: number, dir: -1 | 1) {
    const ids = categories.map((c) => c.id);
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    startTransition(async () => {
      await reorderCategories(ids);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {categories.map((c, i) => (
          <li key={c.id} className="flex items-center gap-3 px-3.5 py-3">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: c.color }}
            >
              <NamedIcon name={c.icon} size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{c.name}</p>
              <p className="truncate text-xs text-ink-3">
                {c.noteCount} {c.noteCount === 1 ? "registro" : "registros"}
                {c.description ? ` · ${c.description}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label={`Mover ${c.name} para cima`}
                disabled={pending || i === 0}
                onClick={() => move(i, -1)}
                className="rounded-lg p-2 text-ink-3 hover:bg-surface-2 hover:text-ink disabled:opacity-30 cursor-pointer"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Mover ${c.name} para baixo`}
                disabled={pending || i === categories.length - 1}
                onClick={() => move(i, 1)}
                className="rounded-lg p-2 text-ink-3 hover:bg-surface-2 hover:text-ink disabled:opacity-30 cursor-pointer"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Editar ${c.name}`}
                onClick={() => {
                  setEditing(c);
                  setEditOpen(true);
                }}
                className="rounded-lg p-2 text-ink-3 hover:bg-surface-2 hover:text-ink cursor-pointer"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Excluir ${c.name}`}
                onClick={() => {
                  setDeleting(c);
                  setReassign("none");
                }}
                className="rounded-lg p-2 text-ink-3 hover:bg-danger-soft hover:text-danger cursor-pointer dark:hover:bg-[#40201a]"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        onClick={() => {
          setEditing(null);
          setEditOpen(true);
        }}
      >
        <Plus className="size-4" /> Nova categoria
      </Button>

      {/* criar / editar */}
      <CategoryFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editing={editing}
      />

      {/* excluir */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Excluir categoria “${deleting?.name}”`}
        description="Suas anotações nunca são apagadas ao excluir uma categoria. Escolha para onde elas devem ir."
      >
        {deleting && deleting.noteCount > 0 ? (
          <div className="space-y-4">
            <Field
              label={`Mover ${deleting.noteCount} ${deleting.noteCount === 1 ? "registro" : "registros"} para…`}
              htmlFor="reassign"
            >
              <Select id="reassign" value={reassign} onChange={(e) => setReassign(e.target.value)}>
                <option value="none">Sem categoria</option>
                {categories
                  .filter((c) => c.id !== deleting.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                loading={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await deleteCategory(deleting.id, reassign === "none" ? null : reassign);
                    if (res.error) toast.error(res.error);
                    else {
                      toast.success(res.message ?? "Categoria excluída.");
                      setDeleting(null);
                    }
                    router.refresh();
                  })
                }
              >
                Excluir categoria
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  if (!deleting) return;
                  const res = await deleteCategory(deleting.id, null);
                  if (res.error) toast.error(res.error);
                  else {
                    toast.success(res.message ?? "Categoria excluída.");
                    setDeleting(null);
                  }
                  router.refresh();
                })
              }
            >
              Excluir categoria vazia
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function CategoryFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: CategoryRow | null;
}) {
  const action = editing ? updateCategory : createCategory;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});
  const toast = useToast();
  const router = useRouter();
  const [color, setColor] = useState(editing?.color ?? COLORS[0]);
  const [icon, setIcon] = useState(editing?.icon ?? "Folder");

  useEffect(() => {
    if (open) {
      setColor(editing?.color ?? COLORS[0]);
      setIcon(editing?.icon ?? "Folder");
    }
  }, [open, editing]);

  useEffect(() => {
    if (state.message) {
      toast.success(state.message);
      onClose();
      router.refresh();
    }
    if (state.error) toast.error(state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Editar “${editing.name}”` : "Nova categoria"}
      description="Categorias organizam as suas anotações. Você pode mudar ícone e cor quando quiser."
    >
      <form action={formAction} className="space-y-4">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <Field label="Nome" htmlFor="cat-name" error={state.error && undefined}>
          <Input id="cat-name" name="name" defaultValue={editing?.name ?? ""} maxLength={60} required placeholder="Ex.: Ervas de cabeça" />
        </Field>
        <Field label="Descrição (opcional)" htmlFor="cat-desc">
          <Textarea id="cat-desc" name="description" defaultValue={editing?.description ?? ""} maxLength={500} rows={2} />
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Ícone</p>
          <div className="grid max-h-40 grid-cols-8 gap-1.5 overflow-y-auto rounded-xl border border-line p-2">
            {ICON_OPTIONS.map((name) => (
              <button
                key={name}
                type="button"
                aria-label={`Ícone ${name}`}
                aria-pressed={icon === name}
                onClick={() => setIcon(name)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg text-ink-2 transition cursor-pointer",
                  icon === name ? "bg-forest text-on-forest" : "hover:bg-surface-2",
                )}
              >
                <NamedIcon name={name} size={16} />
              </button>
            ))}
          </div>
          <input type="hidden" name="icon" value={icon} />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Cor discreta</p>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Cor ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition cursor-pointer ring-offset-2 ring-offset-surface",
                  color === c && "ring-2 ring-gold",
                )}
                style={{ backgroundColor: c }}
              >
                {color === c && <Check className="size-4 text-white" />}
              </button>
            ))}
          </div>
          <input type="hidden" name="color" value={color} />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            {editing ? "Salvar alterações" : "Criar categoria"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
