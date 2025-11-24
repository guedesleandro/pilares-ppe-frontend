import { listPatients } from "@/lib/api";
import { PatientsList } from "@/components/patients/patients-list";

export default async function PacientesPage() {
  const initialData = await listPatients({ pageSize: 10 });

  return (
    <PatientsList initialData={initialData} defaultPageSize={10} />
  );
}


