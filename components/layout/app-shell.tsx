"use client";

import type { CSSProperties, ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import type { CurrentUser } from "@/lib/auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type AppShellProps = {
  user: CurrentUser | null;
  children: ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "4rem",
        } as CSSProperties
      }
    >
      <AppSidebar user={user} variant="inset" />
      <SidebarInset className="m-2 rounded-3xl border bg-background shadow-sm overflow-hidden md:m-4">
        <AppHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <main className="flex-1 px-4 md:px-6">{children}</main>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


