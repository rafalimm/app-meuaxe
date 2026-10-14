import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AxeSymbol } from "./logo";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  useSymbol = false,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  useSymbol?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-line-2 bg-surface/60 px-6 py-14 text-center",
        className,
      )}
    >
      {useSymbol ? (
        <AxeSymbol size={52} className="opacity-70" />
      ) : Icon ? (
        <span className="flex size-14 items-center justify-center rounded-2xl bg-sage-soft text-forest dark:bg-surface-2 dark:text-sage">
          <Icon className="size-7" />
        </span>
      ) : null}
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-2">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
