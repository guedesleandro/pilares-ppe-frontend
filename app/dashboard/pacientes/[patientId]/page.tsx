type PatientDetailPageProps = {
  params: {
    patientId: string;
  };
};

export default function PatientDetailPage({ params }: PatientDetailPageProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        Paciente #{params.patientId}
      </h1>
      <p className="text-muted-foreground">
        {/* Comentário em pt-BR: placeholder para detalhes do paciente */}
        Em breve você poderá visualizar o prontuário completo deste paciente.
      </p>
    </div>
  );
}


