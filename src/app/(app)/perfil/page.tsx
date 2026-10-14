import type { Metadata } from "next";
import Link from "next/link";
import { and, count, eq, isNull, ne, sum } from "drizzle-orm";
import { CalendarDays, Feather, FileText, NotebookPen, Settings, Star } from "lucide-react";
import { db } from "@/db";
import { attachments, diaryEntries, notes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fmtDateLong, formatBytes } from "@/lib/utils";
import { PageTitle, Card } from "@/components/ui";
import { AvatarUploader, ProfileForm } from "@/components/profile-forms";

export const metadata: Metadata = { title: "Meu Perfil" };

export default async function PerfilPage() {
  const user = await requireUser();

  const [notesCount, diaryCount, favCount, fileStats] = await Promise.all([
    db
      .select({ value: count() })
      .from(notes)
      .where(and(eq(notes.userId, user.id), isNull(notes.deletedAt))),
    db
      .select({ value: count() })
      .from(diaryEntries)
      .where(and(eq(diaryEntries.userId, user.id), isNull(diaryEntries.deletedAt))),
    db
      .select({ value: count() })
      .from(notes)
      .where(and(eq(notes.userId, user.id), eq(notes.favorite, true), isNull(notes.deletedAt))),
    db
      .select({ total: sum(attachments.size), qtde: count() })
      .from(attachments)
      .where(and(eq(attachments.userId, user.id), ne(attachments.purpose, "inline"))),
  ]);

  const avatarUrl = user.avatarAttachmentId ? `/api/files/${user.avatarAttachmentId}` : null;

  return (
    <div className="space-y-6">
      <PageTitle title="Meu Perfil" description="Suas informações, sua foto e o resumo da sua caminhada de estudos." />

      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-forest-deep via-forest to-forest-bright" />
        <div className="-mt-10 px-5 pb-5 sm:px-7 sm:pb-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <AvatarUploader name={user.name} avatarUrl={avatarUrl} />
              <h2 className="mt-3 font-display text-2xl font-semibold text-ink">{user.name}</h2>
              <p className="text-sm text-ink-2">{user.email}</p>
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-ink-3">
                <CalendarDays className="size-3.5" /> Caminhando com o Meu Axé desde {fmtDateLong(user.createdAt)}
              </p>
            </div>
            <Link
              href="/configuracoes"
              className="inline-flex items-center gap-2 self-start rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-2 sm:self-end"
            >
              <Settings className="size-4" /> Configurações
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard icon={NotebookPen} label="Anotações e estudos" value={notesCount[0]?.value ?? 0} href="/caderno" />
        <StatCard icon={Feather} label="Entradas no diário" value={diaryCount[0]?.value ?? 0} href="/diario" />
        <StatCard icon={Star} label="Estudos favoritos" value={favCount[0]?.value ?? 0} href="/favoritos" />
        <StatCard
          icon={FileText}
          label="Arquivos na biblioteca"
          value={fileStats[0]?.qtde ?? 0}
          suffix={formatBytes(Number(fileStats[0]?.total ?? 0))}
          href="/biblioteca"
        />
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Informações básicas</h2>
        <div className="mt-4">
          <ProfileForm name={user.name} />
        </div>
        <p className="mt-3 text-xs text-ink-3">
          Para alterar senha, tema ou excluir a conta, acesse as{" "}
          <Link href="/configuracoes" className="font-medium text-forest hover:underline dark:text-sage">
            Configurações
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  href,
}: {
  icon: typeof NotebookPen;
  label: string;
  value: number;
  suffix?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:border-sage hover:shadow-lift"
    >
      <Icon className="size-5 text-forest dark:text-sage" />
      <p className="mt-3 font-display text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-ink-2">
        {label}
        {suffix ? <span className="text-ink-3"> · {suffix}</span> : null}
      </p>
    </Link>
  );
}
