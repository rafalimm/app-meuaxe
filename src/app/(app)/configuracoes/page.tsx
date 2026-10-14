import type { Metadata } from "next";
import Link from "next/link";
import { and, count, eq, ne, sum } from "drizzle-orm";
import {
  Accessibility,
  Database,
  FileDown,
  FolderCog,
  KeyRound,
  LogOut,
  Palette,
  ShieldCheck,
  Target,
  User,
} from "lucide-react";
import { db } from "@/db";
import { attachments } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { categoriesWithCounts, getPreferences } from "@/lib/queries";
import { formatBytes } from "@/lib/utils";
import { PageTitle, Card } from "@/components/ui";
import { CategoriesManager } from "@/components/categories-manager";
import {
  A11yToggles,
  ChangePasswordForm,
  DeleteAccountZone,
  GoalForm,
  ProfileForm,
  ThemeToggle,
} from "@/components/profile-forms";
import { signOut } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Configurações" };

function Section({
  icon: Icon,
  title,
  description,
  children,
  id,
}: {
  icon: typeof Palette;
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-forest dark:bg-surface-2 dark:text-sage">
            <Icon className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm leading-relaxed text-ink-2">{description}</p>}
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </Card>
    </section>
  );
}

export default async function ConfiguracoesPage() {
  const user = await requireUser();
  const [prefs, cats, fileStats] = await Promise.all([
    getPreferences(user.id),
    categoriesWithCounts(user.id),
    db
      .select({ total: sum(attachments.size), qtde: count() })
      .from(attachments)
      .where(and(eq(attachments.userId, user.id), ne(attachments.purpose, "inline"))),
  ]);

  const theme = (prefs?.theme === "dark" ? "dark" : "light") as "light" | "dark";
  const storage = fileStats[0];

  return (
    <div className="space-y-6">
      <PageTitle title="Configurações" description="Ajuste o aplicativo do seu jeito: perfil, aparência, categorias, privacidade e dados." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Section icon={User} title="Perfil" description="Como você aparece no seu espaço.">
          <ProfileForm name={user.name} />
          <p className="mt-3 text-xs text-ink-3">
            E-mail: <span className="font-medium text-ink-2">{user.email}</span> (usado para entrar e recuperar a senha) ·{" "}
            <Link href="/perfil" className="font-medium text-forest hover:underline dark:text-sage">
              ver página de perfil
            </Link>
          </p>
        </Section>

        <Section icon={Palette} title="Aparência" description="Tema claro ou escuro, salvo na sua conta.">
          <ThemeToggle current={theme} />
          <p className="mt-3 text-xs text-ink-3">
            O tema escuro usa uma paleta própria em tons de verde-profundo, pensada para leitura noturna.
          </p>
        </Section>

        <Section icon={Accessibility} title="Acessibilidade" description="Preferências aplicadas imediatamente.">
          <A11yToggles reducedMotion={prefs?.reducedMotion ?? false} largeText={prefs?.largeText ?? false} />
        </Section>

        <Section icon={Target} title="Página inicial" description="Defina um objetivo exibido na sua central de estudos.">
          <GoalForm initial={prefs?.dashboardGoal ?? ""} />
        </Section>
      </div>

      <Section
        icon={FolderCog}
        title="Categorias"
        description="Crie, renomeie, reordene e exclua categorias. Ao excluir, você escolhe para onde as anotações vão — nada é apagado sem sua escolha."
        id="categorias"
      >
        <CategoriesManager
          categories={cats.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            icon: c.icon,
            color: c.color,
            noteCount: c.noteCount,
          }))}
        />
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section icon={FileDown} title="Exportação de dados" description="Baixe seus estudos quando quiser. Os arquivos são seus.">
          <ul className="space-y-2.5 text-sm">
            <ExportRow href="/api/export?formato=md" label="Todas as anotações em Markdown (.zip)" desc="Um arquivo .md por anotação, com títulos, datas, categorias e tags." />
            <ExportRow href="/api/export?formato=json" label="Backup completo em JSON" desc="Anotações, diário, categorias, tags, relações e metadados de arquivos." />
            <ExportRow href="/api/export?formato=zip" label="Pacote completo (.zip)" desc="Markdown + todos os anexos da biblioteca, quando disponíveis." />
          </ul>
          <p className="mt-3 text-xs text-ink-3">
            Se algum anexo não puder ser incluído, você verá a lista no arquivo LEIAME do pacote.
          </p>
        </Section>

        <Section icon={Database} title="Gerenciamento de arquivos" description="Espaço utilizado pela sua biblioteca privada.">
          <p className="text-sm text-ink">
            <span className="font-display text-2xl font-semibold">{formatBytes(Number(storage?.total ?? 0))}</span>{" "}
            <span className="text-ink-2">em {storage?.qtde ?? 0} {Number(storage?.qtde ?? 0) === 1 ? "arquivo" : "arquivos"}</span>
          </p>
          <Link
            href="/biblioteca"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline dark:text-sage"
          >
            Abrir a biblioteca de arquivos
          </Link>
        </Section>

        <Section icon={ShieldCheck} title="Privacidade" description="Como tratamos o seu conteúdo.">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
            <li>Todo o conteúdo é privado por padrão: nenhuma anotação é pública ou visível para outras contas.</li>
            <li>Arquivos usam endereços autenticados e temporários de acesso — só a sua sessão consegue abri-los.</li>
            <li>Não existe feed social nem compartilhamento automático com outros usuários.</li>
            <li>Você pode exportar ou excluir todos os seus dados a qualquer momento.</li>
          </ul>
        </Section>

        <Section icon={KeyRound} title="Segurança da conta" description="Altere sua senha regularmente.">
          <ChangePasswordForm />
        </Section>
      </div>

      <Section icon={LogOut} title="Sessão" description="Encerre o acesso neste dispositivo.">
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-2 cursor-pointer"
          >
            <LogOut className="size-4" /> Encerrar sessão
          </button>
        </form>
      </Section>

      <Section icon={ShieldCheck} title="Zona de perigo">
        <DeleteAccountZone email={user.email} />
      </Section>
    </div>
  );
}

function ExportRow({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <li className="rounded-xl border border-line bg-surface-2/50 p-3.5">
      <a href={href} className="font-medium text-forest hover:underline dark:text-sage">
        {label}
      </a>
      <p className="mt-0.5 text-xs text-ink-2">{desc}</p>
    </li>
  );
}
