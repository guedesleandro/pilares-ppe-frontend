import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  MedicationsList,
  type Medication,
} from "@/components/medications/medications-list";
import { getMedications } from "@/app/api/medications/route";

const TOKEN_COOKIE_NAME = "ppe_access_token";

export default async function MedicacoesPage() {
  // Comentário em pt-BR: verifica autenticação antes de buscar dados
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  // Comentário em pt-BR: usa função auxiliar do Route Handler
  const medications = await getMedications();
  return <MedicationsList medications={medications} />;
}


