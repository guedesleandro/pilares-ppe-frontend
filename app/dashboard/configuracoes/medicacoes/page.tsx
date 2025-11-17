import { redirect } from "next/navigation";

import {
  MedicationsList,
  type Medication,
} from "@/components/medications/medications-list";
import { getServerAuthToken } from "@/lib/auth";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:8000";

async function fetchMedications(): Promise<Medication[]> {
  const token = await getServerAuthToken();

  if (!token) {
    redirect("/login");
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/medications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // Comentário em pt-BR: log para facilitar o debug caso a API retorne erro
      console.error("Falha ao carregar medicações:", response.statusText);
      return [];
    }

    const data = (await response.json()) as Medication[];
    return data;
  } catch (error) {
    // Comentário em pt-BR: log de erro inesperado
    console.error("Erro inesperado ao carregar medicações:", error);
    return [];
  }
}

export default async function MedicacoesPage() {
  const medications = await fetchMedications();
  return <MedicationsList medications={medications} />;
}


