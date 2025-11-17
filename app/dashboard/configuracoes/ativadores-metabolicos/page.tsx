import { redirect } from "next/navigation";

import {
  ActivatorsList,
  type Activator,
  type SubstanceOption,
} from "@/components/activators/activators-list";
import { getServerAuthToken } from "@/lib/auth";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:8000";

async function fetchActivators(token: string): Promise<Activator[]> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/activators`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // Comentário em pt-BR: log para depuração caso a API retorne erro
      console.error("Falha ao carregar ativadores:", response.statusText);
      return [];
    }

    return (await response.json()) as Activator[];
  } catch (error) {
    // Comentário em pt-BR: logando erro inesperado
    console.error("Erro inesperado ao carregar ativadores:", error);
    return [];
  }
}

async function fetchSubstances(token: string): Promise<SubstanceOption[]> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/substances`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Falha ao carregar substâncias:", response.statusText);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data)
      ? data.map((item: { id: string; name: string }) => ({
          id: item.id,
          name: item.name,
        }))
      : [];
  } catch (error) {
    console.error("Erro inesperado ao carregar substâncias:", error);
    return [];
  }
}

export default async function AtivadoresMetabolicosPage() {
  const token = await getServerAuthToken();

  if (!token) {
    redirect("/login");
  }

  const [activators, substances] = await Promise.all([
    fetchActivators(token),
    fetchSubstances(token),
  ]);

  return <ActivatorsList activators={activators} substances={substances} />;
}


