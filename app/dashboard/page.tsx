"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();

  // Comentário em pt-BR: função simples de logout chamando a rota interna e redirecionando
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="max-w-xl text-center">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mb-6 text-zinc-600 dark:text-zinc-400">
          Esta é a tela inicial protegida. Aqui ficará a visão geral da gestão
          de pacientes.
        </p>
        <Button variant="outline" onClick={handleLogout}>
          Sair
        </Button>
      </div>
    </main>
  );
}


