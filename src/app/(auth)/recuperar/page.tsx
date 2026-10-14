import type { Metadata } from "next";
import { RecoverForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecoverPage() {
  return <RecoverForm />;
}
