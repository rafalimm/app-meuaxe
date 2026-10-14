"use client";

import { useTransition, type ReactNode } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createNote } from "@/app/actions/notes";
import { createDiaryEntry } from "@/app/actions/diary";
import { useToast } from "./toast";
import { cn } from "@/lib/utils";

export function NewNoteButton({
  kind = "note",
  label = "Nova anotação",
  className,
  variant = "primary",
  children,
}: {
  kind?: string;
  label?: string;
  className?: string;
  variant?: "primary" | "gold" | "secondary";
  children?: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const styles = {
    primary: "bg-forest text-on-forest hover:bg-forest-bright",
    gold: "bg-gold text-forest-deep hover:bg-gold-deep hover:text-white",
    secondary: "bg-surface border border-line text-ink hover:bg-surface-2",
  }[variant];

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await createNote({ kind });
          } catch {
            toast.error("Não foi possível criar. Verifique sua conexão.");
          }
        })
      }
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-[0_8px_20px_-8px_rgb(23_61_48/0.55)] transition active:scale-[0.98] disabled:opacity-60 cursor-pointer",
        styles,
        className,
      )}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      {children ?? label}
    </button>
  );
}

export function NewDiaryButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await createDiaryEntry();
          } catch {
            toast.error("Não foi possível criar a entrada.");
          }
        })
      }
      className={cn(
        "inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-medium text-on-forest shadow-[0_8px_20px_-8px_rgb(23_61_48/0.55)] transition hover:bg-forest-bright active:scale-[0.98] disabled:opacity-60 cursor-pointer",
        className,
      )}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      Nova entrada no diário
    </button>
  );
}

export function useRouterRefresh() {
  const router = useRouter();
  return () => router.refresh();
}
