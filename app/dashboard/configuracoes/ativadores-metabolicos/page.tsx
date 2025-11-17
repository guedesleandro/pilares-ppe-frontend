import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ActivatorsList,
  type SubstanceOption,
} from "@/components/activators/activators-list";
import { getActivators } from "@/app/api/activators/route";
import { getSubstances } from "@/app/api/substances/route";

const TOKEN_COOKIE_NAME = "ppe_access_token";

export default async function AtivadoresMetabolicosPage() {
  // Comentário em pt-BR: verifica autenticação antes de buscar dados
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  // Comentário em pt-BR: usa funções auxiliares dos Route Handlers
  const [activators, substancesData] = await Promise.all([
    getActivators(),
    getSubstances(),
  ]);

  // Comentário em pt-BR: converte Substance[] para SubstanceOption[]
  const substances: SubstanceOption[] = substancesData.map((item) => ({
    id: item.id,
    name: item.name,
  }));

  return <ActivatorsList activators={activators} substances={substances} />;
}


