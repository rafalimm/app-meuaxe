"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoreHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOOD_LABELS } from "@/lib/constants";
import type { DiaryListItem } from "@/lib/queries";
import { toggleDiaryFavorite, moveEntryToTrash } from "@/app/actions/diary";
import { useToast } from "./toast";
import { ConfirmDialog } from "./dialog";
import { EmptyState } from "./empty-state";
import { Feather } from "lucide-react";
import { NewDiaryButton } from "./new-record";

const WEEKDAYS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const monthFmt = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DiaryView({ entries }: { entries: DiaryListItem[] }) {
  const [view, setView] = useState<"timeline" | "calendar">("timeline");

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Feather}
        title="Seu diário espiritual começa aqui"
        description="Registre experiências, aprendizados e reflexões da sua caminhada. Este espaço é totalmente privado — nada é publicado ou compartilhado."
        action={<NewDiaryButton />}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-xl border border-line bg-surface p-1 shadow-card" role="tablist" aria-label="Modo de visualização">
        {(
          [
            { key: "timeline", label: "Linha do tempo", icon: Clock3 },
            { key: "calendar", label: "Calendário", icon: CalendarDays },
          ] as const
        ).map((v) => (
          <button
            key={v.key}
            role="tab"
            aria-selected={view === v.key}
            onClick={() => setView(v.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition cursor-pointer",
              view === v.key ? "bg-forest text-on-forest" : "text-ink-2 hover:text-ink",
            )}
          >
            <v.icon className="size-4" /> {v.label}
          </button>
        ))}
      </div>

      {view === "timeline" ? <Timeline entries={entries} /> : <CalendarView entries={entries} />}
    </div>
  );
}

function Timeline({ entries }: { entries: DiaryListItem[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, DiaryListItem[]>();
    for (const e of entries) {
      const key = monthFmt.format(new Date(e.entryDate));
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [entries]);

  return (
    <div className="space-y-8">
      {groups.map(([month, list]) => (
        <section key={month}>
          <h2 className="sticky top-14 z-10 -mx-1 bg-bg/90 px-1 py-2 font-display text-lg font-semibold capitalize text-ink backdrop-blur-sm lg:top-0">
            {month}
          </h2>
          <div className="mt-2 space-y-3 border-l-2 border-line pl-4 sm:pl-6">
            {list.map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CalendarView({ entries }: { entries: DiaryListItem[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date(entries[0]?.entryDate ?? Date.now());
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string>(dateKey(entries[0]?.entryDate ?? new Date().toISOString()));

  const byDay = useMemo(() => {
    const map = new Map<string, DiaryListItem[]>();
    for (const e of entries) {
      const key = dateKey(e.entryDate);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [entries]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // semana começando na segunda
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ key: string; day?: number }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ key: `e${i}` });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ key: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day: d });
  }

  const dayEntries = byDay.get(selected) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Mês anterior"
            className="rounded-lg p-2 text-ink-2 hover:bg-surface-2 cursor-pointer"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="size-4" />
          </button>
          <p className="font-display text-base font-semibold capitalize text-ink">{monthFmt.format(cursor)}</p>
          <button
            type="button"
            aria-label="Próximo mês"
            className="rounded-lg p-2 text-ink-2 hover:bg-surface-2 cursor-pointer"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-ink-3">
          {WEEKDAYS.map((d) => (
            <span key={d} className="py-1">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c) =>
            c.day === undefined ? (
              <span key={c.key} />
            ) : (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelected(c.key)}
                aria-pressed={selected === c.key}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-lg text-sm transition cursor-pointer",
                  selected === c.key
                    ? "bg-forest font-semibold text-on-forest"
                    : "text-ink hover:bg-surface-2",
                )}
              >
                {c.day}
                {byDay.has(c.key) && (
                  <span
                    className={cn(
                      "absolute bottom-1 size-1.5 rounded-full",
                      selected === c.key ? "bg-gold" : "bg-gold-deep dark:bg-gold",
                    )}
                  />
                )}
              </button>
            ),
          )}
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="font-display text-base font-semibold text-ink">
          {dayEntries.length > 0
            ? `${dayEntries.length} ${dayEntries.length === 1 ? "registro" : "registros"} neste dia`
            : "Nenhum registro neste dia"}
        </h3>
        {dayEntries.map((e) => (
          <EntryCard key={e.id} entry={e} compact />
        ))}
      </div>
    </div>
  );
}

function EntryCard({ entry, compact = false }: { entry: DiaryListItem; compact?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [fav, setFav] = useState(entry.favorite);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [, startTransition] = useTransition();

  const d = new Date(entry.entryDate);
  const day = String(d.getDate()).padStart(2, "0");
  const monthShort = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d).replace(".", "");
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <article className="group relative flex gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:border-line-2 hover:shadow-lift">
      <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-surface-2 py-2">
        <span className="font-display text-xl font-semibold leading-none text-forest dark:text-sage">{day}</span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-3">{monthShort}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/diario/${entry.id}`} className="min-w-0">
            <h3 className="truncate font-display text-[1.02rem] font-semibold text-ink hover:text-forest">
              {entry.title || "Registro sem título"}
            </h3>
          </Link>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
              aria-pressed={fav}
              onClick={() => {
                const next = !fav;
                setFav(next);
                startTransition(async () => {
                  const res = await toggleDiaryFavorite(entry.id, next);
                  if (res.error) {
                    setFav(!next);
                    toast.error(res.error);
                  }
                  router.refresh();
                });
              }}
              className={cn(
                "rounded-lg p-1.5 cursor-pointer",
                fav ? "text-gold-deep dark:text-gold" : "text-ink-3 opacity-0 hover:text-gold-deep group-hover:opacity-100",
              )}
            >
              <Star className={cn("size-4", fav && "fill-current")} />
            </button>
            <div className="relative">
              <button
                type="button"
                aria-label="Opções"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-lg p-1.5 text-ink-3 opacity-0 hover:bg-surface-2 hover:text-ink group-hover:opacity-100 cursor-pointer"
              >
                <MoreHorizontal className="size-4" />
              </button>
              {menuOpen && (
                <>
                  <button aria-hidden tabIndex={-1} className="fixed inset-0 z-20 cursor-default" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-30 w-48 overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-pop">
                    <Link href={`/diario/${entry.id}`} className="block px-3.5 py-2.5 text-sm text-ink hover:bg-surface-2">
                      Abrir
                    </Link>
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
        {!compact && entry.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-2">{entry.excerpt}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-3">
          <span>{time}</span>
          {entry.mood && MOOD_LABELS[entry.mood] && (
            <span className="rounded-full bg-gold-soft px-2 py-0.5 font-medium text-gold-deep dark:bg-[#3a3320] dark:text-gold">
              {MOOD_LABELS[entry.mood]}
            </span>
          )}
          {entry.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-ink-2">
              #{t}
            </span>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={confirmTrash}
        onCancel={() => setConfirmTrash(false)}
        onConfirm={() => {
          setConfirmTrash(false);
          startTransition(async () => {
            const res = await moveEntryToTrash(entry.id);
            if (res.error) {
              toast.error(res.error);
              return;
            }
            toast.success("Movido para a lixeira.");
            router.refresh();
          });
        }}
        title="Mover para a lixeira"
        description="A entrada ficará na lixeira por 30 dias e poderá ser restaurada. Depois disso, será excluída permanentemente."
        confirmLabel="Mover para a lixeira"
      />
    </article>
  );
}
