import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, isNull } from "drizzle-orm";
import { ArrowRight, Feather, Star } from "lucide-react";
import { db } from "@/db";
import { diaryEntries } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { listNotes } from "@/lib/queries";
import { fmtDate, truncate } from "@/lib/utils";
import { PageTitle } from "@/components/ui";
import { NoteCard } from "@/components/note-card";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Favoritos" };

export default async function FavoritosPage() {
  const user = await requireUser();
  const [notes, diary] = await Promise.all([
    listNotes(user.id, { favorite: true }),
    db
      .select()
      .from(diaryEntries)
      .where(and(eq(diaryEntries.userId, user.id), eq(diaryEntries.favorite, true), isNull(diaryEntries.deletedAt)))
      .orderBy(desc(diaryEntries.entryDate))
      .limit(50),
  ]);

  const total = notes.length + diary.length;

  return (
    <div className="space-y-8">
      <PageTitle
        title="Favoritos"
        description="Seus estudos e registros marcados com estrela, reunidos em um só lugar para acesso rápido."
      />

      {total === 0 ? (
        <EmptyState
          icon={Star}
          title="Nenhum favorito ainda"
          description="Toque na estrela de qualquer anotação ou entrada do diário para guardá-la aqui como referência rápida."
        />
      ) : (
        <>
          {notes.length > 0 && (
            <section>
              <h2 className="mb-3.5 font-display text-lg font-semibold text-ink">
                Anotações e estudos ({notes.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {notes.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            </section>
          )}

          {diary.length > 0 && (
            <section>
              <h2 className="mb-3.5 inline-flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <Feather className="size-4.5 text-ink-3" /> Diário espiritual ({diary.length})
              </h2>
              <div className="space-y-2.5">
                {diary.map((e) => (
                  <Link
                    key={e.id}
                    href={`/diario/${e.id}`}
                    className="group flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:border-sage hover:shadow-lift"
                  >
                    <Star className="size-4 shrink-0 fill-gold text-gold" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-semibold text-ink">
                        {e.title || "Registro sem título"}
                      </p>
                      <p className="truncate text-sm text-ink-2">
                        {fmtDate(e.entryDate)} · {truncate(e.contentText, 120) || "Sem conteúdo"}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-ink-3 transition group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
