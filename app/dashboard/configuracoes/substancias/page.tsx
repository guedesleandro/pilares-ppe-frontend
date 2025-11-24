import { redirect } from "next/navigation";

import { SubstancesList } from "@/components/substances/substances-list";
import { getServerAuthToken } from "@/lib/auth";
import { listSubstances } from "@/lib/api";

export default async function SubstanciasPage() {

  const substances = await listSubstances();
  return <SubstancesList substances={substances} />;
}


