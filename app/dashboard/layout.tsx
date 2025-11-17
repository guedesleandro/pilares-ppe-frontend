import type { ReactNode } from "react";

import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppShell user={user}>{children}</AppShell>
    </div>
  );
}



