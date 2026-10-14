"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { success: () => {}, error: () => {}, info: () => {} };
  }
  return ctx;
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId++;
    setItems((prev) => [...prev.slice(-3), { id, kind, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 z-[90] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm shadow-lift animate-pop",
              t.kind === "success" && "border-line bg-surface text-ink",
              t.kind === "error" && "border-danger/30 bg-surface text-ink",
              t.kind === "info" && "border-line bg-surface text-ink",
            )}
          >
            {t.kind === "success" && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />}
            {t.kind === "error" && <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />}
            {t.kind === "info" && <Info className="mt-0.5 size-4 shrink-0 text-gold-deep" />}
            <p className="flex-1 leading-snug">{t.message}</p>
            <button
              aria-label="Fechar notificação"
              className="text-ink-3 hover:text-ink cursor-pointer"
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
