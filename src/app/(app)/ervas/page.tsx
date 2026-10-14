import type { Metadata } from "next";
import { Leaf } from "lucide-react";
import { StudyAreaView } from "@/components/study-area-view";

export const metadata: Metadata = { title: "Ervas e Banhos" };

export default function ErvasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <StudyAreaView
      title="Ervas, Banhos e Defumações"
      description="Documente ervas, banhos e defumações conforme as fontes que você consulta, com materiais, modo de preparo e cuidados de segurança."
      kinds={["erva", "banho", "defumacao"]}
      addKind="erva"
      addLabel="Novo registro"
      emptyIcon={Leaf}
      emptyTitle="Nenhum registro de ervas ainda"
      emptyDescription="Comece registrando uma erva ou preparo que você aprendeu, com nome popular, nome científico (se souber), finalidade segundo a sua fonte e os cuidados indicados."
      notice={{
        title: "Cuidados de segurança",
        text: "Registre alergias, irritação na pele, plantas tóxicas e riscos do uso de fogo em defumações. Este aplicativo não recomenda ingerir ervas desconhecidas nem misturas sem orientação — anote sempre a fonte do ensinamento e, em caso de dúvida, procure orientação qualificada.",
      }}
      searchParams={searchParams}
    />
  );
}
