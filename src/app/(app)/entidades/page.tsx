import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { StudyAreaView } from "@/components/study-area-view";

export const metadata: Metadata = { title: "Entidades e Linhas" };

export default function EntidadesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <StudyAreaView
      title="Entidades, Linhas e Orixás"
      description="Organize seus estudos sobre entidades, linhas de trabalho e Orixás, relacionando anotações, ervas e documentos."
      kinds={["entidade"]}
      addKind="entidade"
      addLabel="Novo estudo"
      emptyIcon={Sparkles}
      emptyTitle="Nenhum estudo registrado ainda"
      emptyDescription="Esta área começa vazia de propósito: aqui não há conteúdo pronto nem “verdades” pré-definidas. Registre o que você estuda e aprende, com as suas referências, e relacione com outras anotações do seu caderno."
      searchParams={searchParams}
    />
  );
}
