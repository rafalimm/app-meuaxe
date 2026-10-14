"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const first = ref.current?.querySelector<HTMLElement>(
      "input, textarea, select, button:not([data-close])",
    );
    first?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        aria-label="Fechar"
        className="absolute inset-0 bg-forest-deep/45 backdrop-blur-[3px] animate-fade cursor-default"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        ref={ref}
        className={cn(
          "relative w-full bg-surface border border-line shadow-lift animate-pop overflow-hidden",
          "rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 sm:px-6 py-4">
            <div>
              {title && <h2 className="font-display text-lg font-semibold">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
            </div>
            <button
              data-close
              onClick={onClose}
              aria-label="Fechar janela"
              className="rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 sm:px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} description={description}>
      {children}
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
