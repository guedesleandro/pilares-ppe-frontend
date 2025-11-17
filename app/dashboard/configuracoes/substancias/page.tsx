import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  SubstancesList,
  type Substance,
} from "@/components/substances/substances-list";
import { getSubstances } from "@/app/api/substances/route";

const TOKEN_COOKIE_NAME = "ppe_access_token";

export default async function SubstanciasPage() {
  // Comentário em pt-BR: verifica autenticação antes de buscar dados
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  // Comentário em pt-BR: usa função auxiliar do Route Handler
  const substances = await getSubstances();
  return <SubstancesList substances={substances} />;
}


