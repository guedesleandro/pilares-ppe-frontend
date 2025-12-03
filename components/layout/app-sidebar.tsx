"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ChevronDown,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Pill,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import type { CurrentUser } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { clearAuthTokenCookie } from "@/lib/api";

type AppSidebarProps = {
  user: CurrentUser | null;
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
};

const SUBMENU_LINKS = [
  {
    label: "Medicações",
    href: "/dashboard/configuracoes/medicacoes",
    icon: Pill,
  },
  {
    label: "Substâncias",
    href: "/dashboard/configuracoes/substancias",
    icon: FlaskConical,
  },
  {
    label: "Ativadores Metabólicos",
    href: "/dashboard/configuracoes/ativadores-metabolicos",
    icon: Activity,
  },
];

export function AppSidebar({
  user,
  variant = "sidebar",
  collapsible = "icon",
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [configOpen, setConfigOpen] = useState(
    pathname.startsWith("/dashboard/configuracoes"),
  );

  useEffect(() => {
    setConfigOpen(pathname.startsWith("/dashboard/configuracoes"));
  }, [pathname]);

  const handleLogout = async () => {
    clearAuthTokenCookie();
    // Comentário em pt-BR: usa hard redirect para garantir que o cookie seja limpo no servidor
    window.location.href = "/login";
  };

  const isDashboard = pathname === "/dashboard";
  const isPacientes = pathname.startsWith("/dashboard/pacientes");
  const isConfiguracoes = pathname.startsWith("/dashboard/configuracoes");

  return (
    <Sidebar variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/60 px-3 py-2 group-data-[collapsible=icon]:hidden">
          <div className="flex flex-col text-sm font-semibold leading-tight">
            <span>Pilares da Saúde</span>
            <span className="text-xs text-sidebar-foreground/70">
              Gestão de Emagrecimento
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isDashboard}>
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isPacientes}>
                  <Link href="/dashboard/pacientes">
                    <Users className="size-4" />
                    <span>Pacientes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible
                open={configOpen}
                onOpenChange={setConfigOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isConfiguracoes}>
                      <Settings className="size-4" />
                      <span>Configurações</span>
                      <ChevronDown
                        className={cn(
                          "ml-auto size-4 transition-transform duration-200",
                          configOpen && "rotate-180",
                        )}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {SUBMENU_LINKS.map((item) => {
                        const Icon = item.icon;
                        const active = pathname.startsWith(item.href);

                        return (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton asChild isActive={active}>
                              <Link href={item.href}>
                                <Icon className="size-4" />
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto">
        <div className="flex items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-3 py-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
            {user?.username?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">
              {user?.username ?? "Usuário"}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              {user?.username ?? "email@exemplo.com"}
            </span>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
            aria-label="Sair"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}


