import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { StudyAreaView } from "@/components/study-area-view";

export const metadata: Metadata = { title: "Fundamentos" };

export default function FundamentosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <StudyAreaView
      title="Fundamentos"
      description="Registre os fundamentos e conhecimentos que você estuda, sempre indicando de onde veio cada ensinamento: um livro, uma aula, uma pessoa mais velha, a sua casa."
      kinds={["fundamento"]}
      addKind="fundamento"
      addLabel="Novo fundamento"
      emptyIcon={BookOpen}
      emptyTitle="Nenhum fundamento registrado ainda"
      emptyDescription="Os fundamentos são a base dos seus estudos. Registre o que você aprende e de quem ou de onde aprendeu — cada tradição tem suas particularidades, e o seu caderno respeita isso."
      notice={{
        title: "Registre com a sua fonte",
        text: "Nada aqui é universal ou obrigatório: use o campo “Fonte ou origem” para indicar onde aprendeu cada fundamento. Assim, seu caderno reflete a sua caminhada e a sua tradição.",
      }}
      searchParams={searchParams}
    />
  );
}
