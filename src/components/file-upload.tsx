"use client";

import { useRef, useState, type ReactNode } from "react";
import { Loader2, Paperclip, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_FILE_TYPES } from "@/lib/constants";
import { useToast } from "./toast";

export interface UploadedFile {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  description: string;
  createdAt: string;
  noteId: string | null;
  diaryEntryId: string | null;
}

export function FileUploadButton({
  noteId,
  diaryEntryId,
  purpose = "library",
  accept = ACCEPTED_FILE_TYPES,
  variant = "button",
  label = "Anexar arquivo",
  onUploaded,
  className,
  children,
}: {
  noteId?: string;
  diaryEntryId?: string;
  purpose?: string;
  accept?: string;
  variant?: "button" | "dropzone";
  label?: string;
  onUploaded?: (file: UploadedFile) => void;
  className?: string;
  children?: ReactNode;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function send(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("purpose", purpose);
      if (noteId) fd.set("noteId", noteId);
      if (diaryEntryId) fd.set("diaryEntryId", diaryEntryId);
      const res = await fetch("/api/files/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; error?: string; file?: UploadedFile; id?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Não foi possível enviar o arquivo.");
        return;
      }
      toast.success(`Arquivo "${file.name}" enviado.`);
      onUploaded?.(
        data.file ?? {
          id: data.id ?? "",
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          description: "",
          createdAt: new Date().toISOString(),
          noteId: noteId ?? null,
          diaryEntryId: diaryEntryId ?? null,
        },
      );
    } catch {
      toast.error("Falha de conexão durante o envio. Verifique sua internet e tente novamente.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) void send(f);
      }}
    />
  );

  if (variant === "dropzone") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-line-2 bg-surface/60 p-4 text-center transition",
          "hover:border-sage hover:bg-surface",
          className,
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) void send(f);
        }}
      >
        {input}
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center gap-1.5 py-2 text-sm text-ink-2 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-ink-3" />
          ) : (
            <UploadCloud className="size-5 text-ink-3" />
          )}
          {uploading ? "Enviando…" : children ?? "Arraste um arquivo aqui ou clique para escolher"}
          <span className="text-xs text-ink-3">PDF, imagens (JPG, PNG, WebP) e textos</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {input}
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition hover:bg-surface-2 disabled:opacity-60 cursor-pointer",
          className,
        )}
      >
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        {uploading ? "Enviando…" : label}
      </button>
    </>
  );
}
