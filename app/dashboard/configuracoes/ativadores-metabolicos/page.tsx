import { redirect } from "next/navigation";

import {
  ActivatorsList,
  type SubstanceOption,
} from "@/components/activators/activators-list";
import { getServerAuthToken } from "@/lib/auth";
import { listActivators, listSubstances } from "@/lib/api";

export default async function AtivadoresMetabolicosPage() {

  const [activators, substancesData] = await Promise.all([
    listActivators(),
    listSubstances(),
  ]);

  const substances: SubstanceOption[] = substancesData.map((item) => ({
    id: item.id,
    name: item.name,
  }));

  return <ActivatorsList activators={activators} substances={substances} />;
}


