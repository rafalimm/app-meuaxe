"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Droplets,
  Flame,
  FolderOpen,
  Home,
  Leaf,
  Feather,
  NotebookPen,
  Plus,
  Search,
  Settings,
  Soup,
  Sparkles,
  Star,
  Trash2,
  LogOut,
  Menu as MenuIcon,
  X,
  ChevronDown,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn, initialsOf } from "@/lib/utils";
import { Logo } from "./logo";
import { ToastProvider } from "./toast";
import { NOTE_KINDS } from "@/lib/constants";
import { createNote } from "@/app/actions/notes";
import { createDiaryEntry } from "@/app/actions/diary";
import { signOut } from "@/app/actions/auth";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/inicio", label: "Início", icon: Home },
  { href: "/caderno", label: "Meu Caderno", icon: NotebookPen },
  { href: "/fundamentos", label: "Fundamentos", icon: BookOpen },
  { href: "/ervas", label: "Ervas e Banhos", icon: Leaf },
  { href: "/pratos", label: "Pratos e Oferendas", icon: Soup },
  { href: "/entidades", label: "Entidades e Linhas", icon: Sparkles },
  { href: "/diario", label: "Diário Espiritual", icon: Feather },
  { href: "/biblioteca", label: "Biblioteca", icon: FolderOpen },
  { href: "/favoritos", label: "Favoritos", icon: Star },
  { href: "/lixeira", label: "Lixeira", icon: Trash2 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Avatar({ name, avatarUrl, size = 36 }: { name: string; avatarUrl: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`Foto de ${name}`}
        width={size}
        height={size}
        className="rounded-full object-cover ring-1 ring-line"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex items-center justify-center rounded-full bg-forest font-display text-on-forest"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}

function QuickCreateMenu({
  open,
  onClose,
  align = "left",
}: {
  open: boolean;
  onClose: () => void;
  align?: "left" | "center";
}) {
  const [pending, startTransition] = useTransition();
  const [pendingKind, setPendingKind] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);

  if (!open) return null;

  function choose(kind: string) {
    setPendingKind(kind);
    startTransition(async () => {
      await createNote({ kind });
    });
  }

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 w-64 overflow-hidden rounded-2xl border border-line bg-surface shadow-lift animate-pop",
        align === "left" ? "left-0" : "left-1/2 -translate-x-1/2",
        "bottom-full mb-2 lg:bottom-auto lg:top-full lg:mb-0 lg:mt-2",
      )}
      role="menu"
    >
      <p className="px-4 pt-3 pb-1.5 text-xs font-medium uppercase tracking-wider text-ink-3">
        Criar novo registro
      </p>
      <div className="max-h-[55vh] overflow-y-auto pb-1">
        {NOTE_KINDS.map((k) => (
          <button
            key={k.value}
            role="menuitem"
            disabled={pending}
            onClick={() => choose(k.value)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink hover:bg-surface-2 cursor-pointer disabled:opacity-50"
          >
            <span
              className="flex size-7 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: k.color }}
            >
              {pendingKind === k.value ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <KindGlyph icon={k.icon} />
              )}
            </span>
            {k.label}
          </button>
        ))}
        <div className="my-1 border-t border-line" />
        <button
          role="menuitem"
          disabled={pending}
          onClick={() => {
            setPendingKind("diario");
            startTransition(async () => {
              await createDiaryEntry();
            });
          }}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink hover:bg-surface-2 cursor-pointer disabled:opacity-50"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-gold text-forest-deep">
            {pendingKind === "diario" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Feather className="size-3.5" />
            )}
          </span>
          Entrada no Diário
        </button>
      </div>
    </div>
  );
}

function KindGlyph({ icon }: { icon: string }) {
  const map: Record<string, LucideIcon> = {
    NotebookPen,
    BookOpen,
    Leaf,
    Droplets,
    Flame,
    Soup,
    Sparkles,
  };
  const Cmp = map[icon] ?? NotebookPen;
  return <Cmp className="size-3.5" />;
}

function UserBlock({ user }: { user: { name: string; email: string; avatarUrl: string | null } }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
      <Link href="/perfil" aria-label="Abrir perfil">
        <Avatar name={user.name} avatarUrl={user.avatarUrl} size={38} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href="/perfil" className="block truncate text-sm font-medium text-ink hover:text-forest">
          {user.name}
        </Link>
        <p className="truncate text-xs text-ink-3">{user.email}</p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          title="Encerrar sessão"
          aria-label="Encerrar sessão"
          className="rounded-lg p-2 text-ink-3 hover:bg-surface-2 hover:text-danger cursor-pointer"
        >
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string; avatarUrl: string | null };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [quickOpen, setQuickOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setQuickOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <ToastProvider>
      <div className="min-h-dvh">
        {/* ------------------------- Sidebar (desktop) ------------------------- */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-68 flex-col border-r border-line bg-surface lg:flex">
          <div className="flex items-center justify-between px-5 pt-6 pb-4">
            <Link href="/inicio" aria-label="Meu Axé — início">
              <Logo size={34} />
            </Link>
          </div>
          <div className="relative px-4 pb-3">
            <button
              onClick={() => setQuickOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-medium text-on-forest shadow-[0_8px_20px_-8px_rgb(23_61_48/0.55)] transition hover:bg-forest-bright cursor-pointer"
              aria-expanded={quickOpen}
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="size-4" /> Nova anotação
              </span>
              <ChevronDown className={cn("size-4 transition-transform", quickOpen && "rotate-180")} />
            </button>
            <QuickCreateMenu open={quickOpen} onClose={() => setQuickOpen(false)} />
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Navegação principal">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-sage-soft font-medium text-forest dark:bg-surface-2 dark:text-gold"
                      : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  <item.icon
                    className={cn("size-[18px]", active ? "text-forest dark:text-gold" : "text-ink-3 group-hover:text-ink-2")}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-line p-3">
            <UserBlock user={user} />
          </div>
        </aside>

        {/* --------------------------- Mobile top bar -------------------------- */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur-md lg:hidden">
          <Link href="/inicio" aria-label="Meu Axé — início">
            <Logo size={30} withWordmark={false} />
          </Link>
          <span className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-forest dark:text-on-forest">
            Meu Axé
          </span>
          <div className="flex items-center gap-1">
            <Link
              href="/pesquisa"
              aria-label="Pesquisar"
              className="rounded-lg p-2 text-ink-2 hover:bg-surface-2"
            >
              <Search className="size-5" />
            </Link>
            <Link href="/perfil" aria-label="Perfil">
              <Avatar name={user.name} avatarUrl={user.avatarUrl} size={30} />
            </Link>
          </div>
        </header>

        {/* ------------------------------- Conteúdo ----------------------------- */}
        <main className="lg:pl-68">
          <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-8">
            {children}
          </div>
        </main>

        {/* -------------------------- Mobile bottom nav ------------------------- */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
          aria-label="Navegação inferior"
        >
          <div className="mx-auto grid max-w-md grid-cols-5">
            <MobileTab href="/inicio" label="Início" icon={Home} active={isActive(pathname, "/inicio")} />
            <MobileTab href="/caderno" label="Caderno" icon={NotebookPen} active={isActive(pathname, "/caderno")} />
            <div className="relative flex items-center justify-center">
              <button
                onClick={() => setQuickOpen((v) => !v)}
                aria-label="Criar novo registro"
                className="-mt-5 flex size-13 items-center justify-center rounded-full bg-forest text-on-forest shadow-lift ring-4 ring-bg cursor-pointer active:scale-95 transition-transform"
              >
                <Plus className="size-6" />
              </button>
              <QuickCreateMenu open={quickOpen} onClose={() => setQuickOpen(false)} align="center" />
            </div>
            <MobileTab href="/diario" label="Diário" icon={Feather} active={isActive(pathname, "/diario")} />
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 py-2 text-ink-3 cursor-pointer"
              aria-label="Abrir menu"
            >
              <MenuIcon className="size-5" />
              <span className="text-[10px] font-medium">Menu</span>
            </button>
          </div>
        </nav>

        {/* ----------------------------- Mobile drawer ---------------------------- */}
        {drawerOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <button
              aria-label="Fechar menu"
              className="absolute inset-0 bg-forest-deep/45 backdrop-blur-[3px] animate-fade cursor-default"
              onClick={() => setDrawerOpen(false)}
              tabIndex={-1}
            />
            <div className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col bg-surface shadow-lift animate-pop">
              <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
                <Logo size={30} />
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Fechar menu"
                  className="rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Menu completo">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                        active
                          ? "bg-sage-soft font-medium text-forest dark:bg-surface-2 dark:text-gold"
                          : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                      )}
                    >
                      <item.icon className="size-[18px]" />
                      {item.label}
                    </Link>
                  );
                })}
                <Link
                  href="/pesquisa"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink"
                >
                  <Search className="size-[18px]" />
                  Pesquisar
                </Link>
              </nav>
              <div className="border-t border-line p-3">
                <UserBlock user={user} />
              </div>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}

function MobileTab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 py-2",
        active ? "text-forest dark:text-gold" : "text-ink-3",
      )}
    >
      <Icon className="size-5" />
      <span className={cn("text-[10px] font-medium", active && "font-semibold")}>{label}</span>
    </Link>
  );
}
