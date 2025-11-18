"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function getBreadcrumbSegments(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length || segments[0] !== "dashboard") {
    return [];
  }

  const mapLabel: Record<string, string> = {
    dashboard: "Dashboard",
    pacientes: "Pacientes",
    configuracoes: "Configurações",
    medicacoes: "Medicações",
    substancias: "Substâncias",
    "ativadores-metabolicos": "Ativadores Metabólicos",
  };

  const items: { label: string; href: string }[] = [];
  let href = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    href += `/${segment}`;

    // Comentário em pt-BR: se o segmento anterior é "pacientes" e o atual é um UUID, usa "Ficha do Paciente"
    if (
      i > 0 &&
      segments[i - 1] === "pacientes" &&
      isUUID(segment)
    ) {
      items.push({ label: "Ficha do Paciente", href });
    } else {
      const label = mapLabel[segment] ?? segment;
      items.push({ label, href });
    }
  }

  return items;
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const breadcrumbItems = getBreadcrumbSegments(pathname);
  const hasEllipsis = breadcrumbItems.length > 3;
  const firstItem = breadcrumbItems[0];
  const lastItem =
    breadcrumbItems.length > 1
      ? breadcrumbItems[breadcrumbItems.length - 1]
      : undefined;
  const middleItems =
    breadcrumbItems.length > 2 ? breadcrumbItems.slice(1, -1) : [];

  const isDark = theme === "dark";

  return (
    <header className="flex h-[var(--header-height,4rem)] min-h-[var(--header-height,4rem)] items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger className="shrink-0" />

      <div className="flex flex-1 items-center overflow-hidden">
        <Breadcrumb className="w-full">
          <BreadcrumbList className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
            {!hasEllipsis &&
              breadcrumbItems.map((item, index) => {
                const isLast = index === breadcrumbItems.length - 1;

                return (
                  <Fragment key={item.href}>
                    <BreadcrumbItem className="truncate">
                      {isLast ? (
                        <BreadcrumbPage className="truncate">
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild className="truncate">
                          <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbItems.length - 1 && (
                      <BreadcrumbSeparator />
                    )}
                  </Fragment>
                );
              })}

            {hasEllipsis && firstItem && lastItem && (
              <>
                <BreadcrumbItem className="truncate">
                  <BreadcrumbLink asChild className="truncate">
                    <Link href={firstItem.href}>{firstItem.label}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <BreadcrumbEllipsis />
                      <span className="sr-only">
                        Mostrar caminhos intermediários
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {middleItems.map((item) => (
                        <DropdownMenuItem
                          key={item.href}
                          onSelect={(event) => {
                            event.preventDefault();
                            router.push(item.href);
                          }}
                        >
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="truncate">
                  <BreadcrumbPage className="truncate">
                    {lastItem.label}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        onClick={toggleTheme}
        aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
        className={cn(
          "shrink-0",
          isDark ? "text-yellow-300" : "text-muted-foreground",
        )}
      >
        <Sun
          className={cn(
            "size-4 transition-transform",
            isDark ? "scale-75 opacity-0" : "scale-100 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "absolute size-4 transition-transform",
            isDark ? "scale-100 opacity-100" : "scale-75 opacity-0",
          )}
        />
      </Button>
    </header>
  );
}


