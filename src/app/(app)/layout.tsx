import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { ensureDefaultCategories } from "@/app/actions/categories";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  await ensureDefaultCategories(user.id);

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarAttachmentId ? `/api/files/${user.avatarAttachmentId}` : null,
      }}
    >
      {children}
    </AppShell>
  );
}
