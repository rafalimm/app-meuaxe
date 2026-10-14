import type { ReactNode, ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------- Button ------------------------------- */

type ButtonVariant = "primary" | "gold" | "secondary" | "ghost" | "danger" | "soft";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const btnBase =
  "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 disabled:opacity-55 disabled:pointer-events-none select-none cursor-pointer whitespace-nowrap";

const btnVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-forest text-on-forest hover:bg-forest-bright active:scale-[0.985] shadow-[0_1px_2px_rgb(23_61_48/0.25),0_8px_20px_-8px_rgb(23_61_48/0.5)]",
  gold: "bg-gold text-forest-deep hover:bg-gold-deep hover:text-white active:scale-[0.985] shadow-[0_1px_2px_rgb(169_136_72/0.3),0_8px_20px_-8px_rgb(169_136_72/0.55)]",
  secondary:
    "bg-surface text-ink border border-line hover:border-line-2 hover:bg-surface-2 active:scale-[0.985]",
  ghost: "text-ink-2 hover:text-ink hover:bg-surface-2",
  danger:
    "bg-danger text-white hover:bg-[#96351f] active:scale-[0.985] shadow-[0_1px_2px_rgb(176_67_47/0.3)]",
  soft: "bg-sage-soft text-forest hover:bg-[#dde6da] dark:bg-surface-2 dark:text-ink dark:hover:bg-surface-3",
};

const btnSizes: Record<ButtonSize, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
  lg: "text-[0.95rem] px-6 py-3",
  icon: "p-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(btnBase, btnVariants[variant], btnSizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

/* -------------------------------- Inputs ------------------------------- */

const inputBase =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputBase, "min-h-24 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(inputBase, "appearance-none pr-9 bg-no-repeat cursor-pointer", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23748077' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 0.75rem center",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-ink-2">{hint}</p>}
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* --------------------------------- Card -------------------------------- */

export function Card({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl border border-line bg-surface shadow-card", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* --------------------------------- Badge ------------------------------- */

type BadgeVariant = "sage" | "gold" | "line" | "forest" | "danger";

const badgeVariants: Record<BadgeVariant, string> = {
  sage: "bg-sage-soft text-forest dark:bg-surface-2 dark:text-ink-2",
  gold: "bg-gold-soft text-gold-deep dark:bg-[#3a3320] dark:text-gold",
  line: "border border-line text-ink-2",
  forest: "bg-forest text-on-forest",
  danger: "bg-danger-soft text-danger dark:bg-[#40201a]",
};

export function Badge({
  variant = "sage",
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------ Tipografia ----------------------------- */

export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-ink-2 max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin text-ink-3", className)} aria-hidden="true" />;
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-line", className)} />;
}
