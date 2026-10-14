"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  ExternalLink,
  FileText,
  File as FileIcon,
  Image as ImageIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { cn, fmtDate, formatBytes } from "@/lib/utils";
import { ConfirmDialog, Modal } from "./dialog";
import { Button, Field, Input, Textarea } from "./ui";
import { useToast } from "./toast";
import { deleteAttachment, updateAttachment } from "@/app/actions/attachments";
import type { UploadedFile } from "./file-upload";

function mimeIcon(mime: string) {
  if (mime === "application/pdf") return FileText;
  if (mime.startsWith("image/")) return ImageIcon;
  return FileIcon;
}

export function AttachmentList({
  items,
  emptyLabel = "Nenhum arquivo anexado ainda.",
}: {
  items: UploadedFile[];
  emptyLabel?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [preview, setPreview] = useState<UploadedFile | null>(null);
  const [editing, setEditing] = useState<UploadedFile | null>(null);
  const [removing, setRemoving] = useState<UploadedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-3">{emptyLabel}</p>;
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    const res = await updateAttachment(editing.id, { fileName: name, description: desc });
    setBusy(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Arquivo atualizado.");
    setEditing(null);
    router.refresh();
  }

  async function confirmRemove() {
    if (!removing) return;
    setBusy(true);
    const res = await deleteAttachment(removing.id);
    setBusy(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Arquivo excluído.");
    }
    setRemoving(null);
    router.refresh();
  }

  return (
    <>
      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {items.map((file) => {
          const Icon = mimeIcon(file.mimeType);
          const isImage = file.mimeType.startsWith("image/");
          return (
            <li key={file.id} className="flex items-center gap-3 px-3.5 py-3">
              <button
                type="button"
                onClick={() => (isImage ? setPreview(file) : window.open(`/api/files/${file.id}`, "_blank"))}
                className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-surface-2 text-ink-2 overflow-hidden"
                aria-label={`Visualizar ${file.fileName}`}
              >
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/files/${file.id}`} alt="" className="size-full object-cover" loading="lazy" />
                ) : (
                  <Icon className="size-5" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => (isImage ? setPreview(file) : window.open(`/api/files/${file.id}`, "_blank"))}
                  className="block max-w-full cursor-pointer truncate text-left text-sm font-medium text-ink hover:text-forest"
                >
                  {file.fileName}
                </button>
                <p className="truncate text-xs text-ink-3">
                  {formatBytes(file.size)} · {fmtDate(file.createdAt)}
                  {file.description ? ` · ${file.description}` : ""}
                  {file.noteId ? (
                    <>
                      {" · "}
                      <Link href={`/caderno/${file.noteId}`} className="text-gold-deep hover:underline dark:text-gold">
                        ver anotação
                      </Link>
                    </>
                  ) : null}
                  {file.diaryEntryId ? (
                    <>
                      {" · "}
                      <Link href={`/diario/${file.diaryEntryId}`} className="text-gold-deep hover:underline dark:text-gold">
                        ver entrada do diário
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="relative flex items-center gap-1">
                <a
                  href={`/api/files/${file.id}?download=1`}
                  title="Baixar"
                  aria-label={`Baixar ${file.fileName}`}
                  className="rounded-lg p-2 text-ink-3 hover:bg-surface-2 hover:text-ink"
                >
                  <Download className="size-4" />
                </a>
                <button
                  type="button"
                  aria-label="Mais opções"
                  aria-expanded={menuFor === file.id}
                  onClick={() => setMenuFor((v) => (v === file.id ? null : file.id))}
                  className="rounded-lg p-2 text-ink-3 hover:bg-surface-2 hover:text-ink cursor-pointer"
                >
                  <MoreHorizontal className="size-4" />
                </button>
                {menuFor === file.id && (
                  <div className="absolute right-0 top-full z-30 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-pop">
                    <a
                      href={`/api/files/${file.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-ink hover:bg-surface-2"
                    >
                      <ExternalLink className="size-4" /> Abrir
                    </a>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-ink hover:bg-surface-2 cursor-pointer"
                      onClick={() => {
                        setEditing(file);
                        setName(file.fileName);
                        setDesc(file.description);
                        setMenuFor(null);
                      }}
                    >
                      <Pencil className="size-4" /> Renomear / descrever
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-danger hover:bg-danger-soft cursor-pointer dark:hover:bg-[#40201a]"
                      onClick={() => {
                        setRemoving(file);
                        setMenuFor(null);
                      }}
                    >
                      <Trash2 className="size-4" /> Excluir
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Pré-visualização de imagem */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.fileName} wide>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/files/${preview.id}`}
            alt={preview.description || preview.fileName}
            className="mx-auto max-h-[70vh] w-auto rounded-xl border border-line"
          />
        )}
        {preview?.description && <p className="mt-3 text-sm text-ink-2">{preview.description}</p>}
      </Modal>

      {/* Edição */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Detalhes do arquivo">
        <div className="space-y-4">
          <Field label="Nome do arquivo" htmlFor="att-name">
            <Input id="att-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
          </Field>
          <Field label="Descrição" htmlFor="att-desc" hint="Opcional. Ajuda na pesquisa.">
            <Textarea id="att-desc" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={1000} rows={3} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} loading={busy}>
              Salvar alterações
            </Button>
          </div>
        </div>
      </Modal>

      {/* Exclusão */}
      <ConfirmDialog
        open={!!removing}
        onCancel={() => setRemoving(null)}
        onConfirm={confirmRemove}
        loading={busy}
        danger
        title="Excluir arquivo"
        description={`"${removing?.fileName}" será excluído permanentemente e removido das anotações relacionadas. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir permanentemente"
      />
    </>
  );
}

export function CloseMenuOnOutside({ onClose }: { onClose: () => void }) {
  return (
    <button aria-hidden tabIndex={-1} className={cn("fixed inset-0 z-20 cursor-default")} onClick={onClose} />
  );
}

export function RemoveIcon() {
  return <X className="size-4" />;
}
