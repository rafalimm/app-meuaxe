"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  FileDown,
  Link2,
  MoreHorizontal,
  Paperclip,
  Pin,
  PinOff,
  ShieldAlert,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NoteMetadata } from "@/db/schema";
import {
  duplicateNote,
  moveNoteToTrash,
  toggleFavorite,
  togglePin,
  updateNote,
} from "@/app/actions/notes";
import { RichTextEditor } from "./rich-text-editor";
import { SaveStatus, type SaveState } from "./save-status";
import { TagInput } from "./tag-input";
import { Field, Input, Select, Textarea } from "./ui";
import { FileUploadButton, type UploadedFile } from "./file-upload";
import { AttachmentList } from "./attachment-list";
import { RelationsManager, type RelationItem } from "./relations-manager";
import { ConfirmDialog } from "./dialog";
import { useToast } from "./toast";
import { KindChip } from "./note-card";
import { ENTITY_TYPES, NOTE_KINDS, ORIGIN_OPTIONS } from "@/lib/constants";

export interface EditableNote {
  id: string;
  kind: string;
  title: string;
  summary: string;
  content: string;
  categoryId: string | null;
  subcategory: string;
  source: string;
  origin: string;
  metadata: NoteMetadata;
  coverAttachmentId: string | null;
  favorite: boolean;
  pinned: boolean;
  updatedAt: string;
}

const DETAIL_KINDS = ["erva", "banho", "defumacao", "prato", "entidade"];

export function NoteEditor({
  note,
  categories,
  initialTags,
  attachments,
  relations,
}: {
  note: EditableNote;
  categories: Array<{ id: string; name: string }>;
  initialTags: string[];
  attachments: UploadedFile[];
  relations: RelationItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [title, setTitle] = useState(note.title);
  const [summary, setSummary] = useState(note.summary);
  const [kind, setKind] = useState(note.kind);
  const [categoryId, setCategoryId] = useState<string | "">(note.categoryId ?? "");
  const [subcategory, setSubcategory] = useState(note.subcategory);
  const [source, setSource] = useState(note.source);
  const [origin, setOrigin] = useState(note.origin);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [favorite, setFavorite] = useState(note.favorite);
  const [pinned, setPinned] = useState(note.pinned);
  const [coverId, setCoverId] = useState<string | null>(note.coverAttachmentId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [trashing, setTrashing] = useState(false);

  // detalhes por tipo (texto livre mapeado para os metadados)
  const meta = note.metadata ?? {};
  const [scientificName, setScientificName] = useState(meta.scientificName ?? "");
  const [purpose, setPurpose] = useState(meta.purpose ?? "");
  const [materialsText, setMaterialsText] = useState((meta.materials ?? []).join("\n"));
  const [ingredientsText, setIngredientsText] = useState((meta.ingredients ?? []).join("\n"));
  const [preparation, setPreparation] = useState(meta.preparation ?? "");
  const [safetyNotes, setSafetyNotes] = useState(meta.safetyNotes ?? "");
  const [entityType, setEntityType] = useState(meta.entityType ?? "");
  const [lineage, setLineage] = useState(meta.lineage ?? "");
  const [occasion, setOccasion] = useState(meta.occasion ?? "");

  const contentRef = useRef(note.content);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(new Date(note.updatedAt));
  const timerRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);

  const buildMetadata = useCallback((): NoteMetadata => {
    const m: NoteMetadata = {};
    if (kind === "erva") m.scientificName = scientificName.trim() || undefined;
    if (["erva", "banho", "defumacao"].includes(kind)) {
      m.purpose = purpose.trim() || undefined;
      m.materials = materialsText.split("\n").map((s) => s.trim()).filter(Boolean);
      m.preparation = preparation.trim() || undefined;
      m.safetyNotes = safetyNotes.trim() || undefined;
    }
    if (kind === "prato") {
      m.ingredients = ingredientsText.split("\n").map((s) => s.trim()).filter(Boolean);
      m.occasion = occasion.trim() || undefined;
      m.preparation = preparation.trim() || undefined;
    }
    if (kind === "entidade") {
      m.entityType = entityType || undefined;
      m.lineage = lineage.trim() || undefined;
    }
    return m;
  }, [kind, scientificName, purpose, materialsText, ingredientsText, preparation, safetyNotes, entityType, lineage, occasion]);

  const saveNow = useCallback(async () => {
    if (savingRef.current) {
      dirtyRef.current = true;
      return;
    }
    savingRef.current = true;
    dirtyRef.current = false;
    setSaveState("saving");
    const snapshot = {
      title,
      summary,
      content: contentRef.current,
      kind,
      categoryId: categoryId || null,
      subcategory,
      source,
      origin: origin as "pessoal" | "referencia" | "ensinamento",
      metadata: buildMetadata(),
      coverAttachmentId: coverId,
    };
    try {
      const res = await updateNote(note.id, snapshot, tags);
      if (res.error) {
        setSaveState("error");
      } else {
        setSaveState("saved");
        setSavedAt(new Date());
      }
    } catch {
      setSaveState(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
    } finally {
      savingRef.current = false;
      if (dirtyRef.current) {
        // houve novas alterações durante o envio
        scheduleSave(600);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, summary, kind, categoryId, subcategory, source, origin, tags, coverId, buildMetadata, note.id]);

  const scheduleSave = useCallback(
    (delay = 1400) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setSaveState((s) => (s === "saving" ? s : "unsaved"));
      timerRef.current = window.setTimeout(() => {
        void saveNow();
      }, delay);
    },
    [saveNow],
  );

  // avisa ao sair com alterações pendentes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveState === "saving" || saveState === "unsaved" || saveState === "error" || saveState === "offline") {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saveState]);

  useEffect(() => {
    if (searchParams.get("nova") === "1") {
      toast.success("Anotação criada. Comece a escrever — salvamos automaticamente.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  function markDirty() {
    scheduleSave();
  }

  async function handleTrash() {
    setTrashing(true);
    const res = await moveNoteToTrash(note.id);
    setTrashing(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Movido para a lixeira.");
    router.push("/caderno");
  }

  async function handleDuplicate() {
    const res = await duplicateNote(note.id);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Duplicado criado.");
    if (res.id) router.push(`/caderno/${res.id}`);
  }

  const showHerbFields = ["erva", "banho", "defumacao"].includes(kind);
  const showDishFields = kind === "prato";
  const showEntityFields = kind === "entidade";
  const showDetails = DETAIL_KINDS.includes(kind);

  return (
    <div className="space-y-6">
      {/* barra superior */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/caderno"
          className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
        >
          <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Voltar</span>
        </Link>
        <KindChip kind={kind} />
        <SaveStatus state={saveState} savedAt={savedAt} onRetry={() => void saveNow()} className="ml-1" />
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label={pinned ? "Desafixar" : "Fixar no topo"}
            aria-pressed={pinned}
            onClick={() => {
              const next = !pinned;
              setPinned(next);
              void togglePin(note.id, next).then((r) => {
                if (r.error) {
                  setPinned(!next);
                  toast.error(r.error);
                }
              });
            }}
            className={cn(
              "rounded-xl p-2.5 transition cursor-pointer",
              pinned ? "text-gold-deep dark:text-gold" : "text-ink-3 hover:bg-surface-2 hover:text-ink",
            )}
          >
            {pinned ? <PinOff className="size-4.5" /> : <Pin className="size-4.5" />}
          </button>
          <button
            type="button"
            aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            aria-pressed={favorite}
            onClick={() => {
              const next = !favorite;
              setFavorite(next);
              void toggleFavorite(note.id, next).then((r) => {
                if (r.error) {
                  setFavorite(!next);
                  toast.error(r.error);
                } else {
                  toast.success(next ? "Adicionado aos favoritos." : "Removido dos favoritos.");
                }
              });
            }}
            className={cn(
              "rounded-xl p-2.5 transition cursor-pointer",
              favorite ? "text-gold-deep dark:text-gold" : "text-ink-3 hover:bg-surface-2 hover:text-ink",
            )}
          >
            <Star className={cn("size-4.5", favorite && "fill-current")} />
          </button>
          <a
            href={`/api/export?tipo=nota&id=${note.id}&formato=md`}
            title="Exportar como Markdown"
            aria-label="Exportar como Markdown"
            className="rounded-xl p-2.5 text-ink-3 transition hover:bg-surface-2 hover:text-ink"
          >
            <FileDown className="size-4.5" />
          </a>
          <div className="relative">
            <button
              type="button"
              aria-label="Mais opções"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-xl p-2.5 text-ink-3 transition hover:bg-surface-2 hover:text-ink cursor-pointer"
            >
              <MoreHorizontal className="size-4.5" />
            </button>
            {menuOpen && (
              <>
                <button aria-hidden tabIndex={-1} className="fixed inset-0 z-20 cursor-default" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-30 w-52 overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-pop">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-ink hover:bg-surface-2 cursor-pointer"
                    onClick={() => {
                      setMenuOpen(false);
                      void handleDuplicate();
                    }}
                  >
                    <Copy className="size-4" /> Duplicar anotação
                  </button>
                  <a
                    href={`/api/export?tipo=nota&id=${note.id}&formato=md`}
                    className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-ink hover:bg-surface-2"
                  >
                    <FileDown className="size-4" /> Exportar (.md)
                  </a>
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* capa */}
      {coverId && (
        <div className="group relative overflow-hidden rounded-2xl border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/files/${coverId}`} alt="Imagem de capa da anotação" className="h-44 w-full object-cover sm:h-56" />
          <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onClick={() => {
                setCoverId(null);
                markDirty();
              }}
              className="rounded-lg bg-forest-deep/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur cursor-pointer"
            >
              Remover capa
            </button>
          </div>
        </div>
      )}

      {/* título */}
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          markDirty();
        }}
        placeholder="Título da anotação"
        aria-label="Título da anotação"
        maxLength={300}
        className="w-full bg-transparent font-display text-3xl font-semibold tracking-tight text-ink placeholder:text-ink-3 focus:outline-none sm:text-4xl"
      />

      {/* resumo */}
      <Textarea
        value={summary}
        onChange={(e) => {
          setSummary(e.target.value);
          markDirty();
        }}
        placeholder="Resumo ou descrição curta (opcional)"
        aria-label="Resumo"
        rows={2}
        maxLength={2000}
        className="border-none bg-surface-2/60 text-[0.95rem] shadow-none focus:bg-surface"
      />

      {/* metadados principais */}
      <div className="grid gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Tipo de registro" htmlFor="f-kind">
          <Select
            id="f-kind"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              markDirty();
            }}
          >
            {NOTE_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Categoria" htmlFor="f-cat">
          <Select
            id="f-cat"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              markDirty();
            }}
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Subcategoria (opcional)" htmlFor="f-sub">
          <Input
            id="f-sub"
            value={subcategory}
            onChange={(e) => {
              setSubcategory(e.target.value);
              markDirty();
            }}
            maxLength={120}
            placeholder="Ex.: linha de estudo, grupo…"
          />
        </Field>
        <Field label="Este conteúdo é…" htmlFor="f-origin">
          <Select
            id="f-origin"
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value);
              markDirty();
            }}
          >
            {ORIGIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fonte, livro, aula ou pessoa" htmlFor="f-src" className="sm:col-span-2">
          <Input
            id="f-src"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              markDirty();
            }}
            maxLength={200}
            placeholder="Onde ou com quem você aprendeu isso? (opcional)"
          />
        </Field>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Tags" hint="Use Enter para adicionar. Elas ajudam na pesquisa.">
            <TagInput
              value={tags}
              onChange={(t) => {
                setTags(t);
                markDirty();
              }}
            />
          </Field>
        </div>
      </div>

      {/* detalhes por tipo */}
      {showDetails && (
        <div className="space-y-4 rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
          <h2 className="font-display text-base font-semibold text-ink">Detalhes do registro</h2>
          {kind === "erva" && (
            <Field label="Nome científico (opcional)" htmlFor="f-sci">
              <Input
                id="f-sci"
                value={scientificName}
                onChange={(e) => {
                  setScientificName(e.target.value);
                  markDirty();
                }}
                placeholder="Ex.: Sansevieria trifasciata"
              />
            </Field>
          )}
          {showHerbFields && (
            <>
              <Field label="Finalidade segundo a fonte consultada" htmlFor="f-purpose">
                <Textarea
                  id="f-purpose"
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    markDirty();
                  }}
                  rows={2}
                  placeholder="Para que serve, de acordo com quem te ensinou"
                />
              </Field>
              <Field label="Materiais" htmlFor="f-mats" hint="Um item por linha.">
                <Textarea
                  id="f-mats"
                  value={materialsText}
                  onChange={(e) => {
                    setMaterialsText(e.target.value);
                    markDirty();
                  }}
                  rows={3}
                  placeholder={"Ex.: 7 folhas de espada-de-são-jorge\nÁgua limpa\n…"}
                />
              </Field>
              <Field label="Modo de preparo anotado" htmlFor="f-prep">
                <Textarea
                  id="f-prep"
                  value={preparation}
                  onChange={(e) => {
                    setPreparation(e.target.value);
                    markDirty();
                  }}
                  rows={3}
                  placeholder="Etapas do preparo conforme a orientação recebida"
                />
              </Field>
              <div className="rounded-xl border border-warning/35 bg-warning-soft p-3.5 dark:bg-[#33270f]">
                <p className="flex items-center gap-2 text-sm font-semibold text-warning">
                  <ShieldAlert className="size-4" /> Avisos de segurança
                </p>
                <Textarea
                  value={safetyNotes}
                  onChange={(e) => {
                    setSafetyNotes(e.target.value);
                    markDirty();
                  }}
                  rows={2}
                  placeholder="Alergias, irritação na pele, planta tóxica, cuidados com fogo, não ingerir…"
                  className="mt-2 border-warning/30 bg-surface/80"
                  aria-label="Avisos de segurança"
                />
              </div>
            </>
          )}
          {showDishFields && (
            <>
              <Field label="Ingredientes ou materiais" htmlFor="f-ing" hint="Um item por linha.">
                <Textarea
                  id="f-ing"
                  value={ingredientsText}
                  onChange={(e) => {
                    setIngredientsText(e.target.value);
                    markDirty();
                  }}
                  rows={4}
                  placeholder={"Ex.: Arroz branco\nCanjica\n…"}
                />
              </Field>
              <Field label="Etapas de preparação" htmlFor="f-prep2">
                <Textarea
                  id="f-prep2"
                  value={preparation}
                  onChange={(e) => {
                    setPreparation(e.target.value);
                    markDirty();
                  }}
                  rows={3}
                />
              </Field>
              <Field label="Ocasião ou contexto (opcional)" htmlFor="f-occ">
                <Input
                  id="f-occ"
                  value={occasion}
                  onChange={(e) => {
                    setOccasion(e.target.value);
                    markDirty();
                  }}
                  placeholder="Ex.: festa de gira, oferenda semanal…"
                />
              </Field>
            </>
          )}
          {showEntityFields && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo de conteúdo" htmlFor="f-etype">
                <Select
                  id="f-etype"
                  value={entityType}
                  onChange={(e) => {
                    setEntityType(e.target.value);
                    markDirty();
                  }}
                >
                  {ENTITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Linha ou agrupamento (opcional)" htmlFor="f-lineage">
                <Input
                  id="f-lineage"
                  value={lineage}
                  onChange={(e) => {
                    setLineage(e.target.value);
                    markDirty();
                  }}
                  placeholder="Como é organizado na sua tradição"
                />
              </Field>
            </div>
          )}
        </div>
      )}

      {/* conteúdo */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6">
        <RichTextEditor
          initialContent={note.content}
          placeholder="Escreva aqui o que você aprendeu…"
          minHeight={320}
          onChange={(html) => {
            contentRef.current = html;
            markDirty();
          }}
        />
      </div>

      {/* anexos */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="inline-flex items-center gap-2 font-display text-base font-semibold text-ink">
            <Paperclip className="size-4 text-ink-3" /> Arquivos anexados
          </h2>
          <div className="flex gap-2">
            <FileUploadButton
              noteId={note.id}
              purpose="cover"
              accept="image/jpeg,image/png,image/webp"
              label="Definir capa"
              onUploaded={(f) => {
                setCoverId(f.id);
                markDirty();
                router.refresh();
              }}
            />
            <FileUploadButton
              noteId={note.id}
              label="Anexar arquivo"
              onUploaded={() => router.refresh()}
            />
          </div>
        </div>
        <AttachmentList items={attachments} />
      </section>

      {/* relacionamentos */}
      <section className="space-y-3">
        <h2 className="inline-flex items-center gap-2 font-display text-base font-semibold text-ink">
          <Link2 className="size-4 text-ink-3" /> Registros relacionados
        </h2>
        <RelationsManager noteId={note.id} initial={relations} />
      </section>

      <ConfirmDialog
        open={confirmTrash}
        onCancel={() => setConfirmTrash(false)}
        onConfirm={handleTrash}
        loading={trashing}
        title="Mover para a lixeira"
        description="A anotação ficará na lixeira por 30 dias e poderá ser restaurada. Depois disso, será excluída permanentemente."
        confirmLabel="Mover para a lixeira"
      />
    </div>
  );
}
