import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Logo, AxeSymbol } from "@/components/logo";
import { APP_TAGLINE } from "@/lib/constants";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/inicio");

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      {/* painel da marca */}
      <div className="relative hidden overflow-hidden bg-forest-deep lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="grain absolute inset-0" aria-hidden="true" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -right-28 opacity-[0.12]"
        >
          <AxeSymbol size={420} leaf="#E7EEE6" vein="#102D24" />
        </div>
        <div className="relative">
          <Link href="/" aria-label="Voltar para a página inicial">
            <Logo size={40} light />
          </Link>
        </div>
        <div className="relative">
          <AxeSymbol size={110} leaf="#E7EEE6" vein="#102D24" />
          <p className="mt-8 font-display text-3xl font-medium leading-snug text-cream max-w-md">
            {APP_TAGLINE}
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-on-forest-2">
            Organize fundamentos, ervas, banhos, pratos, entidades e o seu diário espiritual em um
            só lugar — privado, seguro e sempre com você.
          </p>
        </div>
        <p className="relative text-xs text-on-forest-2/70">
          Respeitamos a diversidade das tradições de Umbanda.
        </p>
      </div>

      {/* formulário */}
      <div className="flex min-h-dvh flex-col bg-bg">
        <div className="flex items-center justify-between p-4 sm:p-6 lg:hidden">
          <Link href="/" aria-label="Voltar para a página inicial">
            <Logo size={32} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink"
          >
            <ArrowLeft className="size-4" /> Início
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-16 pt-4 sm:px-8 lg:pt-16">
          <div className="w-full max-w-md animate-rise">{children}</div>
        </div>
      </div>
    </div>
  );
}
