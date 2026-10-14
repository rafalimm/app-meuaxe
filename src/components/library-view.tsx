"use client";

import { useMemo, useState } from "react";
import { FolderOpen, Search } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { FileUploadButton, type UploadedFile } from "./file-upload";
import { AttachmentList } from "./attachment-list";
import { EmptyState } from "./empty-state";

export function LibraryView({ files }: { files: UploadedFile[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return files;
    return files.filter(
      (f) =>
        f.fileName.toLowerCase().includes(needle) ||
        f.description.toLowerCase().includes(needle) ||
        f.mimeType.toLowerCase().includes(needle),
    );
  }, [files, q]);

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  if (files.length === 0) {
    return (
      <div className="space-y-4">
        <FileUploadButton variant="dropzone" onUploaded={() => window.location.reload()} />
        <EmptyState
          icon={FolderOpen}
          title="Sua biblioteca está vazia"
          description="Envie PDFs, imagens e documentos de estudo. Os arquivos ficam privados e só você tem acesso — nada é público por padrão."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, descrição ou tipo…"
            aria-label="Buscar arquivos"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-ink-3 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          />
        </div>
        <FileUploadButton onUploaded={() => window.location.reload()} label="Enviar arquivo" />
      </div>

      <p className="text-xs text-ink-3">
        {filtered.length} de {files.length} {files.length === 1 ? "arquivo" : "arquivos"} ·{" "}
        {formatBytes(totalSize)} no total · privados na sua conta
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-3">
          Nenhum arquivo encontrado para “{q}”.
        </p>
      ) : (
        <AttachmentList items={filtered} />
      )}
    </div>
  );
}
