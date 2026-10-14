import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { listDiaryEntries } from "@/lib/queries";
import { PageTitle } from "@/components/ui";
import { DiaryView } from "@/components/diary-view";
import { NewDiaryButton } from "@/components/new-record";

export const metadata: Metadata = { title: "Diário Espiritual" };

export default async function DiarioPage() {
  const user = await requireUser();
  const entries = await listDiaryEntries(user.id);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Diário Espiritual"
        description="Um espaço cronológico e totalmente privado para registrar experiências, aprendizados e reflexões da sua caminhada."
        action={<NewDiaryButton />}
      />
      <DiaryView entries={entries} />
    </div>
  );
}
