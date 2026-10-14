import type { Metadata } from "next";
import { Soup } from "lucide-react";
import { StudyAreaView } from "@/components/study-area-view";

export const metadata: Metadata = { title: "Pratos e Oferendas" };

export default function PratosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <StudyAreaView
      title="Pratos e Oferendas"
      description="Documente pratos, receitas, materiais e orientações recebidas na sua tradição, com ingredientes, etapas e a fonte do ensinamento."
      kinds={["prato"]}
      addKind="prato"
      addLabel="Novo prato ou oferenda"
      emptyIcon={Soup}
      emptyTitle="Nenhum prato registrado ainda"
      emptyDescription="Anote os pratos e oferendas que você aprendeu: ingredientes ou materiais, etapas de preparo, observações e quem ensinou. Cada tradição tem suas particularidades — registre as suas."
      notice={{
        title: "A sua tradição, a sua fonte",
        text: "Não existe aqui lista “obrigatória” de ingredientes para nenhuma entidade ou Orixá. O que vale é o que você aprendeu — registre sempre a fonte para não perder esse fio.",
      }}
      searchParams={searchParams}
    />
  );
}
