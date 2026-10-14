import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { listNotes, listDiaryEntries } from "@/lib/queries";
import { purgeExpiredTrash } from "@/app/actions/notes";
import { purgeExpiredDiaryTrash } from "@/app/actions/diary";
import { PageTitle } from "@/components/ui";
import { TrashView } from "@/components/trash-view";
import { TRASH_RETENTION_DAYS } from "@/lib/constants";

export const metadata: Metadata = { title: "Lixeira" };

export default async function LixeiraPage() {
  const user = await requireUser();

  // retenção real: remove itens com mais de 30 dias na lixeira
  await Promise.all([purgeExpiredTrash(), purgeExpiredDiaryTrash()]);

  const [notes, diary] = await Promise.all([
    listNotes(user.id, { deleted: true }),
    listDiaryEntries(user.id, true),
  ]);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Lixeira"
        description={`Itens excluídos ficam disponíveis para restauração por ${TRASH_RETENTION_DAYS} dias. Após esse prazo, são apagados definitivamente.`}
      />
      <TrashView notes={notes} diary={diary} />
    </div>
  );
}
