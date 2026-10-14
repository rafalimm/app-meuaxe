import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Feather,
  FileText,
  FolderOpen,
  NotebookPen,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { APP_QUOTE } from "@/lib/constants";
import { fmtDateLong, greetingByDate } from "@/lib/utils";
import {
  categoriesWithCounts,
  dashboardStats,
  listNotes,
  recentAttachments,
  getPreferences,
} from "@/lib/queries";
import { NoteCard } from "@/components/note-card";
import { NewNoteButton, NewDiaryButton } from "@/components/new-record";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui";
import { NamedIcon } from "@/components/icon";
import { formatBytes } from "@/lib/utils";

export const metadata: Metadata = { title: "Início" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const welcome = sp["bem-vindo"] === "1";
  const user = await requireUser();
  const firstName = user.name.split(" ")[0];

  const [stats, recent, favorites, cats, files, prefs] = await Promise.all([
    dashboardStats(user.id),
    listNotes(user.id, { limit: 6 }),
    listNotes(user.id, { favorite: true, limit: 3 }),
    categoriesWithCounts(user.id),
    recentAttachments(user.id, 5),
    getPreferences(user.id),
  ]);

  const continueNote = recent[0] ?? null;
  const hasContent = stats.total > 0;

  return (
    <div className="space-y-8">
      {/* ------------------------------ cabeçalho ------------------------------ */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="animate-rise">
          <p className="text-sm text-ink-2">{fmtDateLong(new Date())}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {greetingByDate()}, {firstName}.
          </h1>
          {welcome && (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-sage-soft px-3.5 py-1.5 text-sm text-forest dark:bg-surface-2 dark:text-sage">
              <Sparkles className="size-4" /> Seu espaço de estudos foi criado. Comece pela sua primeira anotação.
            </p>
          )}
        </div>
        <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:w-auto">
          <form action="/pesquisa" className="relative flex-1 lg:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <input
              name="q"
              placeholder="Pesquisar em tudo…"
              aria-label="Pesquisa global"
              className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-3 shadow-card focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
            />
          </form>
          <NewNoteButton />
        </div>
      </header>

      {/* ------------------------------ frase destaque ----------------------------- */}
      <section className="relative overflow-hidden rounded-3xl bg-forest-deep p-6 sm:p-8 grain animate-rise" style={{ animationDelay: "0.05s" }}>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">
              Minha central de estudos
            </p>
            <p className="mt-2.5 font-display text-2xl font-medium italic leading-snug text-cream sm:text-[1.75rem]">
              “{APP_QUOTE}”
            </p>
            {prefs?.dashboardGoal && (
              <p className="mt-3 text-sm text-on-forest-2">
                Objetivo atual: <span className="text-cream">{prefs.dashboardGoal}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2.5 sm:items-end">
            <NewNoteButton variant="gold" label="+ Nova anotação" />
            <NewDiaryButton className="bg-transparent border border-gold/50 text-gold hover:bg-gold/10 shadow-none hover:text-gold" />
          </div>
        </div>
      </section>

      {hasContent ? (
        <>
          {/* ------------------------------- estatísticas ------------------------------ */}
          <section className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 animate-rise" style={{ animationDelay: "0.1s" }}>
            <StatCard icon={NotebookPen} label="Anotações" value={stats.total} href="/caderno" />
            <StatCard icon={BookOpen} label="Fundamentos" value={stats.fundamentos} href="/fundamentos" />
            <StatCard icon={Star} label="Favoritos" value={stats.favorites} href="/favoritos" />
            <StatCard icon={TrendingUp} label="Atualizados na semana" value={stats.updatedRecently} href="/caderno" />
          </section>

          {/* ----------------------------- continuar estudando ---------------------------- */}
          {continueNote && (
            <section className="animate-rise" style={{ animationDelay: "0.12s" }}>
              <SectionHeader title="Continuar estudando" href="/caderno" />
              <Link
                href={`/caderno/${continueNote.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:border-sage hover:shadow-lift"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-forest text-on-forest">
                  <NotebookPen className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-semibold text-ink">
                    {continueNote.title || "Sem título"}
                  </p>
                  <p className="truncate text-sm text-ink-2">
                    {continueNote.excerpt || "Toque para continuar de onde parou."}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-forest transition group-hover:gap-2.5 dark:text-sage">
                  Retomar <ArrowRight className="size-4" />
                </span>
              </Link>
            </section>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            {/* --------------------------- anotações recentes --------------------------- */}
            <section className="lg:col-span-2 animate-rise" style={{ animationDelay: "0.15s" }}>
              <SectionHeader title="Anotações recentes" href="/caderno" linkLabel="Ver todas" />
              <div className="grid gap-4 sm:grid-cols-2">
                {recent.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            </section>

            <div className="space-y-8">
              {/* ------------------------------- favoritos ------------------------------- */}
              <section className="animate-rise" style={{ animationDelay: "0.18s" }}>
                <SectionHeader title="Favoritos" href="/favoritos" linkLabel="Ver todos" />
                {favorites.length === 0 ? (
                  <Card className="p-5 text-sm text-ink-2">
                    Marque estudos importantes com a estrela para vê-los aqui.
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {favorites.map((n) => (
                      <Link
                        key={n.id}
                        href={`/caderno/${n.id}`}
                        className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-card transition hover:border-sage hover:shadow-lift"
                      >
                        <Star className="size-4 shrink-0 fill-gold text-gold" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                          {n.title || "Sem título"}
                        </span>
                        <ArrowRight className="size-4 text-ink-3" />
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {/* --------------------------- últimos arquivos --------------------------- */}
              <section className="animate-rise" style={{ animationDelay: "0.2s" }}>
                <SectionHeader title="Últimos arquivos" href="/biblioteca" linkLabel="Biblioteca" />
                {files.length === 0 ? (
                  <Card className="p-5 text-sm text-ink-2">
                    Envie PDFs e imagens para a sua biblioteca de estudos.
                  </Card>
                ) : (
                  <Card className="divide-y divide-line">
                    {files.map((f) => (
                      <a
                        key={f.id}
                        href={`/api/files/${f.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3.5 transition hover:bg-surface-2"
                      >
                        <FileText className="size-4 shrink-0 text-ink-3" />
                        <span className="min-w-0 flex-1 truncate text-sm text-ink">{f.fileName}</span>
                        <span className="text-xs text-ink-3">{formatBytes(f.size)}</span>
                      </a>
                    ))}
                  </Card>
                )}
              </section>
            </div>
          </div>

          {/* ------------------------------- categorias ------------------------------- */}
          <section className="animate-rise" style={{ animationDelay: "0.22s" }}>
            <SectionHeader title="Categorias de estudo" href="/configuracoes" linkLabel="Gerenciar" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {cats.slice(0, 8).map((c) => (
                <Link
                  key={c.id}
                  href={`/caderno?categoria=${c.id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-card transition hover:-translate-y-0.5 hover:border-sage hover:shadow-lift"
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: c.color }}
                  >
                    <CategoryGlyph name={c.icon} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{c.name}</span>
                    <span className="text-xs text-ink-3">
                      {c.noteCount} {c.noteCount === 1 ? "registro" : "registros"}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* ------------------------------ acesso rápido ------------------------------ */}
          <section className="animate-rise" style={{ animationDelay: "0.24s" }}>
            <h2 className="font-display text-lg font-semibold text-ink">Acesso rápido</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { href: "/fundamentos", label: "Fundamentos", icon: BookOpen },
                { href: "/ervas", label: "Ervas e Banhos", icon: Sparkles },
                { href: "/pratos", label: "Pratos e Oferendas", icon: Sparkles },
                { href: "/entidades", label: "Entidades e Linhas", icon: Sparkles },
                { href: "/diario", label: "Diário Espiritual", icon: Feather },
                { href: "/biblioteca", label: "Biblioteca", icon: FolderOpen },
                { href: "/pesquisa", label: "Pesquisa global", icon: Search },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-2 shadow-card transition hover:border-sage hover:text-ink"
                >
                  <l.icon className="size-4 text-forest dark:text-sage" />
                  {l.label}
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        /* ------------------------------- estado vazio ------------------------------- */
        <section className="animate-rise" style={{ animationDelay: "0.1s" }}>
          <EmptyState
            useSymbol
            title="Seu caderno de estudos começa aqui"
            description="Este é o seu espaço privado para registrar tudo o que você aprende: fundamentos, ervas, banhos, pratos, entidades, referências e reflexões. Comece criando a sua primeira anotação."
            action={
              <div className="flex flex-col items-center gap-2.5 sm:flex-row">
                <NewNoteButton label="Criar minha primeira anotação" />
                <NewDiaryButton className="bg-surface border border-line text-ink hover:bg-surface-2 shadow-none" />
              </div>
            }
          />
          <p className="mt-4 text-center text-sm text-ink-3">
            Dica: já criamos algumas categorias iniciais para você — personalize-as em{" "}
            <Link href="/configuracoes" className="font-medium text-forest hover:underline dark:text-sage">
              Configurações
            </Link>
            .
          </p>
        </section>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof NotebookPen;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:border-sage hover:shadow-lift"
    >
      <span className="flex items-center justify-between">
        <Icon className="size-5 text-forest dark:text-sage" />
        <ArrowRight className="size-4 text-ink-3 opacity-0 transition group-hover:opacity-100" />
      </span>
      <p className="mt-3 font-display text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-ink-2">{label}</p>
    </Link>
  );
}

function SectionHeader({
  title,
  href,
  linkLabel = "Ver tudo",
}: {
  title: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-medium text-forest hover:underline dark:text-sage"
      >
        {linkLabel} <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

function CategoryGlyph({ name }: { name: string }) {
  return <NamedIcon name={name} size={16} />;
}
