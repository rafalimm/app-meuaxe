import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";
import { isSafeNext } from "@/lib/utils";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = isSafeNext(typeof sp.next === "string" ? sp.next : null);
  const notice = typeof sp.redefinida === "string" ? "redefinida" : undefined;
  return <LoginForm next={next} notice={notice} />;
}
