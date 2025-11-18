import { getPatients } from "@/app/api/patients/route";
import { PatientsList } from "@/components/patients/patients-list";

export default async function PacientesPage() {
  const initialData = await getPatients({ pageSize: 10 });

  return (
    <PatientsList initialData={initialData} defaultPageSize={10} />
  );
}


