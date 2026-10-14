"use client";

import { Check, CloudOff, CloudUpload, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveState = "idle" | "saving" | "saved" | "error" | "offline" | "unsaved";

export function SaveStatus({
  state,
  savedAt,
  onRetry,
  className,
}: {
  state: SaveState;
  savedAt?: Date | null;
  onRetry?: () => void;
  className?: string;
}) {
  const time =
    savedAt &&
    savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const content = {
    idle: null,
    unsaved: (
      <span className="text-ink-2">
        Alterações ainda não salvas…
      </span>
    ),
    saving: (
      <span className="inline-flex items-center gap-1.5 text-ink-2">
        <CloudUpload className="size-3.5 animate-pulse" /> Salvando…
      </span>
    ),
    saved: (
      <span className="inline-flex items-center gap-1.5 text-success">
        <Check className="size-3.5" /> Salvo{time ? ` às ${time}` : ""}
      </span>
    ),
    error: (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 text-danger hover:underline cursor-pointer"
      >
        <AlertTriangle className="size-3.5" /> Erro ao salvar. Tentar novamente
      </button>
    ),
    offline: (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 text-warning hover:underline cursor-pointer"
      >
        <CloudOff className="size-3.5" /> Sem conexão. Suas alterações estão aqui — tentar salvar
      </button>
    ),
  }[state];

  if (!content) return null;
  return (
    <div className={cn("text-xs", className)} role="status" aria-live="polite">
      {content}
    </div>
  );
}
