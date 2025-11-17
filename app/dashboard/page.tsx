import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Pacientes ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">0</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {/* Comentário em pt-BR: valor estático como placeholder para métricas futuras */}
            Em acompanhamento nos ciclos atuais.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximas sessões</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">0</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sessões agendadas para os próximos 7 dias.
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle>Resumo geral</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {/* Comentário em pt-BR: seção de resumo será alimentada com dados reais na próxima etapa */}
            Aqui ficará um resumo da evolução dos pacientes, ciclos ativos e
            alertas importantes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

