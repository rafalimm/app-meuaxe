"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileDown, MoreHorizontal, Paperclip, Star, Trash2 } from "lucide-react";
import { cn, toLocalInputValue } from "@/lib/utils";
import { MOODS } from "@/lib/constants";
import { moveEntryToTrash, toggleDiaryFavorite, updateDiaryEntry } from "@/app/actions/diary";
import { RichTextEditor } from "./rich-text-editor";
import { SaveStatus, type SaveState } from "./save-status";
import { TagInput } from "./tag-input";
import { Field, Input, Select } from "./ui";
import { FileUploadButton, type UploadedFile } from "./file-upload";
import { AttachmentList } from "./attachment-list";
import { ConfirmDialog } from "./dialog";
import { useToast } from "./toast";

export interface EditableEntry {
  id: string;
  title: string;
  content: string;
  mood: string;
  entryDate: string;
  favorite: boolean;
  updatedAt: string;
}

export function DiaryEditor({
  entry,
  initialTags,
  attachments,
}: {
  entry: EditableEntry;
  initialTags: string[];
  attachments: UploadedFile[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [title, setTitle] = useState(entry.title);
  const [mood, setMood] = useState(entry.mood);
  const [entryDate, setEntryDate] = useState(toLocalInputValue(entry.entryDate));
  const [tags, setTags] = useState<string[]>(initialTags);
  const [favorite, setFavorite] = useState(entry.favorite);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmTrash, setConfirmTrash] = useState(false);

  const contentRef = useRef(entry.content);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(new Date(entry.updatedAt));
  const timerRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);

  const saveNow = useCallback(async () => {
    if (savingRef.current) {
      dirtyRef.current = true;
      return;
    }
    savingRef.current = true;
    dirtyRef.current = false;
    setSaveState("saving");
    try {
      const res = await updateDiaryEntry(
        entry.id,
        { title, content: contentRef.current, mood, entryDate },
        tags,
      );
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
      if (dirtyRef.current) scheduleSave(600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id, title, mood, entryDate, tags]);

  const scheduleSave = useCallback(
    (delay = 1400) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setSaveState((s) => (s === "saving" ? s : "unsaved"));
      timerRef.current = window.setTimeout(() => void saveNow(), delay);
    },
    [saveNow],
  );

  useEffect(() => {
    if (searchParams.get("nova") === "1") {
      toast.success("Entrada criada. Escreva à vontade — salvamos automaticamente.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (["saving", "unsaved", "error", "offline"].includes(saveState)) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saveState]);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/diario"
          className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
        >
          <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Voltar ao diário</span>
        </Link>
        <SaveStatus state={saveState} savedAt={savedAt} onRetry={() => void saveNow()} className="ml-1" />
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label={favorite ? "Remover dos favoritos" : "Favoritar"}
            aria-pressed={favorite}
            onClick={() => {
              const next = !favorite;
              setFavorite(next);
              void toggleDiaryFavorite(entry.id, next).then((r) => {
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
            href={`/api/export?tipo=diario&id=${entry.id}&formato=md`}
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
                    className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-danger hover:bg-danger-soft cursor-pointer dark:hover:bg-[#40201a]"
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

      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          scheduleSave();
        }}
        placeholder="Título do registro (opcional)"
        aria-label="Título do registro"
        maxLength={300}
        className="w-full bg-transparent font-display text-3xl font-semibold tracking-tight text-ink placeholder:text-ink-3 focus:outline-none"
      />

      <div className="grid gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card sm:grid-cols-2">
        <Field label="Data e hora" htmlFor="d-date">
          <Input
            id="d-date"
            type="datetime-local"
            value={entryDate}
            onChange={(e) => {
              setEntryDate(e.target.value);
              scheduleSave();
            }}
          />
        </Field>
        <Field label="Como você se sentiu? (opcional)" htmlFor="d-mood">
          <Select
            id="d-mood"
            value={mood}
            onChange={(e) => {
              setMood(e.target.value);
              scheduleSave();
            }}
          >
            {MOODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Tags">
            <TagInput
              value={tags}
              onChange={(t) => {
                setTags(t);
                scheduleSave();
              }}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6">
        <RichTextEditor
          initialContent={entry.content}
          placeholder="Como foi o seu dia de estudos e vivências? Registre aqui, com liberdade e privacidade…"
          minHeight={300}
          onChange={(html) => {
            contentRef.current = html;
            scheduleSave();
          }}
        />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="inline-flex items-center gap-2 font-display text-base font-semibold text-ink">
            <Paperclip className="size-4 text-ink-3" /> Imagens e anexos
          </h2>
          <FileUploadButton diaryEntryId={entry.id} label="Anexar arquivo" onUploaded={() => router.refresh()} />
        </div>
        <AttachmentList items={attachments} />
      </section>

      <ConfirmDialog
        open={confirmTrash}
        onCancel={() => setConfirmTrash(false)}
        onConfirm={async () => {
          const res = await moveEntryToTrash(entry.id);
          if (res.error) {
            toast.error(res.error);
            return;
          }
          toast.success("Movido para a lixeira.");
          router.push("/diario");
        }}
        title="Mover para a lixeira"
        description="A entrada ficará na lixeira por 30 dias e poderá ser restaurada."
        confirmLabel="Mover para a lixeira"
      />
    </div>
  );
}
