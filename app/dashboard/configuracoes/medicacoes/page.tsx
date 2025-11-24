import { redirect } from "next/navigation";

import { MedicationsList } from "@/components/medications/medications-list";
import { getServerAuthToken } from "@/lib/auth";
import { listMedications } from "@/lib/api";

export default async function MedicacoesPage() {

  const medications = await listMedications();
  return <MedicationsList medications={medications} />;
}


