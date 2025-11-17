import { getPatients } from "@/app/api/patients/route";
import { PatientsList } from "@/components/patients/patients-list";

export default async function PacientesPage() {
  const initialData = await getPatients({ pageSize: 10 });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
        <p className="text-sm text-muted-foreground">
          {/* Comentário em pt-BR: descrição da listagem de pacientes */}
          Pesquise pacientes, consulte ciclos e acesse detalhes individuais.
        </p>
      </div>

      <PatientsList initialData={initialData} defaultPageSize={10} />
    </div>
  );
}


