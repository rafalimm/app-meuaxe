import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FolderOpen,
  Feather,
  Lock,
  NotebookPen,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Logo, AxeSymbol } from "@/components/logo";
import { APP_TAGLINE } from "@/lib/constants";

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh bg-bg">
      {/* ------------------------------- header ------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo size={34} />
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Acesso">
            {user ? (
              <Link
                href="/inicio"
                className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-medium text-on-forest transition hover:bg-forest-bright"
              >
                Ir para o meu espaço <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-2 transition hover:bg-surface-2 hover:text-ink"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-medium text-on-forest transition hover:bg-forest-bright"
                >
                  Criar conta <ArrowRight className="size-4" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* -------------------------------- hero -------------------------------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 opacity-[0.05] dark:opacity-[0.07]"
        >
          <AxeSymbol size={520} />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-20">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold-soft/60 px-3.5 py-1.5 text-xs font-medium tracking-wide text-gold-deep dark:bg-[#2c2818] dark:text-gold">
              <Sparkles className="size-3.5" />
              Caderno digital de estudos sobre Umbanda
            </p>
            <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
              Meu espaço.
              <br />
              Meus estudos.
              <br />
              <span className="text-forest dark:text-sage">Minha caminhada.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
              O Meu Axé é o seu lugar para registrar fundamentos, ervas e banhos, pratos e
              oferendas, entidades e linhas de estudo — com anotações ricas, arquivos privados,
              diário espiritual e pesquisa, tudo organizado do seu jeito.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={user ? "/inicio" : "/cadastro"}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-7 py-3.5 text-base font-medium text-on-forest shadow-[0_14px_30px_-10px_rgb(23_61_48/0.5)] transition hover:bg-forest-bright active:scale-[0.98]"
              >
                Começar meus estudos <ArrowRight className="size-4.5" />
              </Link>
              <Link
                href={user ? "/inicio" : "/login"}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line-2 bg-surface px-7 py-3.5 text-base font-medium text-ink transition hover:border-forest/30 hover:bg-surface-2 active:scale-[0.98]"
              >
                Entrar na minha conta
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-ink-3">
              <Lock className="size-4" />
              Conteúdo privado por padrão. Nada é compartilhado sem você pedir.
            </p>
          </div>

          {/* arte do herói */}
          <div className="relative hidden lg:block animate-rise" style={{ animationDelay: "0.15s" }}>
            <div className="relative mx-auto aspect-square max-w-md">
              <div className="absolute inset-0 rounded-[2.5rem] bg-forest-deep grain shadow-lift" />
              <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-white/10" />
              <div
                className="absolute inset-8 rounded-full border border-gold/25"
                aria-hidden="true"
              />
              <div
                className="absolute inset-16 rounded-full border border-gold/15"
                aria-hidden="true"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <AxeSymbol size={200} leaf="#E7EEE6" vein="#102D24" accent="#C7A96B" className="drop-shadow-2xl" />
              </div>
              {/* cartões flutuantes */}
              <div className="absolute -left-10 top-10 w-48 animate-[floaty_7s_ease-in-out_infinite] rounded-2xl border border-line bg-surface p-3.5 shadow-lift">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-forest text-on-forest">
                    <NotebookPen className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-ink">Meu Caderno</p>
                    <p className="text-[11px] text-ink-3">Salvo automaticamente</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-8 top-1/3 w-44 animate-[floaty_9s_ease-in-out_infinite] rounded-2xl border border-line bg-surface p-3.5 shadow-lift" style={{ animationDelay: "1.2s" }}>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-gold text-forest-deep">
                    <Star className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-ink">Favoritos</p>
                    <p className="text-[11px] text-ink-3">Estudos em destaque</p>
                  </div>
                </div>
              </div>
              <div className="absolute -left-6 bottom-12 w-52 animate-[floaty_8s_ease-in-out_infinite] rounded-2xl border border-line bg-surface p-3.5 shadow-lift" style={{ animationDelay: "2s" }}>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-[#3E6B4F] text-white">
                    <FolderOpen className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-ink">Biblioteca</p>
                    <p className="text-[11px] text-ink-3">PDFs e imagens privadas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- funcionalidades ---------------------------- */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
              Organização do conhecimento
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Um caderno inteligente, uma biblioteca, um diário.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-2">
              Cada área foi pensada para a sua caminhada de estudos, respeitando a diversidade das
              tradições: você registra o que aprende, com a sua fonte, do seu jeito.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={NotebookPen}
              title="Meu Caderno"
              text="Editor rico com títulos, listas, checklists, citações, imagens e salvamento automático."
            />
            <FeatureCard
              icon={BookOpen}
              title="Fundamentos e estudos"
              text="Ervas, banhos, defumações, pratos, oferendas, entidades e linhas em áreas dedicadas."
            />
            <FeatureCard
              icon={Feather}
              title="Diário espiritual"
              text="Linha do tempo e calendário para registrar experiências e reflexões com privacidade."
            />
            <FeatureCard
              icon={Search}
              title="Pesquisa global"
              text="Encontre qualquer anotação, tag, referência ou arquivo em segundos, com filtros."
            />
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <FeatureCard
              icon={FolderOpen}
              title="Biblioteca de arquivos"
              text="PDFs, imagens e textos com acesso privado, visualização e download seguros."
              small
            />
            <FeatureCard
              icon={Smartphone}
              title="Instalável (PWA)"
              text="Use no computador ou instale no celular como um aplicativo, com layout dedicado."
              small
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Privado por padrão"
              text="Autenticação segura, permissões no servidor e nenhum feed público. Seus estudos são seus."
              small
            />
          </div>
        </div>
      </section>

      {/* ------------------------------- frase destaque ------------------------------ */}
      <section className="relative overflow-hidden bg-forest-deep">
        <div aria-hidden="true" className="pointer-events-none absolute -left-16 -bottom-20 opacity-10">
          <AxeSymbol size={360} leaf="#E7EEE6" vein="#102D24" />
        </div>
        <div className="grain relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-28">
          <AxeSymbol size={56} leaf="#A8B9A1" vein="#102D24" className="mx-auto" />
          <blockquote className="mt-8 font-display text-3xl font-medium italic leading-snug text-cream sm:text-4xl">
            “Todo conhecimento merece ser registrado.”
          </blockquote>
          <p className="mt-6 text-sm uppercase tracking-[0.22em] text-on-forest-2">
            {APP_TAGLINE}
          </p>
        </div>
      </section>

      {/* --------------------------------- CTA final --------------------------------- */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:py-24">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Comece hoje o seu caderno de estudos.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-2">
            Crie sua conta gratuitamente e comece a organizar seus conhecimentos em poucos minutos.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={user ? "/inicio" : "/cadastro"}
              className="inline-flex items-center gap-2 rounded-xl bg-forest px-8 py-3.5 text-base font-medium text-on-forest shadow-[0_14px_30px_-10px_rgb(23_61_48/0.5)] transition hover:bg-forest-bright active:scale-[0.98]"
            >
              Começar meus estudos <ArrowRight className="size-5" />
            </Link>
            <Link
              href={user ? "/inicio" : "/login"}
              className="inline-flex items-center gap-2 rounded-xl border border-line-2 bg-surface px-8 py-3.5 text-base font-medium text-ink transition hover:bg-surface-2"
            >
              Entrar na minha conta
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------- rodapé --------------------------------- */}
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left sm:px-6">
          <div>
            <Logo size={30} />
            <p className="mt-2 max-w-sm text-sm text-ink-2">
              Um espaço de estudos que respeita a diversidade das tradições de Umbanda. Registre
              apenas o que você aprendeu, com a fonte que ensinou.
            </p>
          </div>
          <div className="text-sm text-ink-3">
            <p className="flex items-center justify-center gap-2 sm:justify-end">
              <ShieldCheck className="size-4" /> Seus dados pertencem a você.
            </p>
            <p className="mt-1">Exporte quando quiser. Exclua quando decidir.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
  small = false,
}: {
  icon: typeof NotebookPen;
  title: string;
  text: string;
  small?: boolean;
}) {
  return (
    <div className="group rounded-3xl border border-line bg-bg p-6 transition-all duration-300 hover:-translate-y-1 hover:border-sage hover:shadow-lift">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-forest text-on-forest transition-colors group-hover:bg-forest-bright">
        <Icon className="size-5" />
      </span>
      <h3 className={`mt-4 font-display font-semibold text-ink ${small ? "text-lg" : "text-xl"}`}>
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{text}</p>
    </div>
  );
}
