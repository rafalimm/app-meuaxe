import type { Metadata } from "next";
import { ResetForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Redefinir senha" };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  return <ResetForm token={token} />;
}
