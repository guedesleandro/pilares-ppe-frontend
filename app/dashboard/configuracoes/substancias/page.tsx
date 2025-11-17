import { redirect } from "next/navigation";

import {
  SubstancesList,
  type Substance,
} from "@/components/substances/substances-list";
import { getServerAuthToken } from "@/lib/auth";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:8000";

async function fetchSubstances(): Promise<Substance[]> {
  const token = await getServerAuthToken();

  if (!token) {
    redirect("/login");
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/substances`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // Comentário em pt-BR: log para facilitar o debug caso a API retorne erro
      console.error("Falha ao carregar substâncias:", response.statusText);
      return [];
    }

    const data = (await response.json()) as Substance[];
    return data;
  } catch (error) {
    // Comentário em pt-BR: log de erro inesperado
    console.error("Erro inesperado ao carregar substâncias:", error);
    return [];
  }
}

export default async function SubstanciasPage() {
  const substances = await fetchSubstances();
  return <SubstancesList substances={substances} />;
}


