import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/app/api/dashboard/stats/route";
import { formatNumberPt } from "@/lib/utils";
import { ActivatorsChart } from "@/components/dashboard/activators-chart";
import { MedicationsChart } from "@/components/dashboard/medications-chart";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total de Pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {stats?.total_patients ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pacientes cadastrados no sistema.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessões nos Últimos 30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {stats?.sessions_last_30_days ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sessões realizadas no último mês.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total de Quilos Perdidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {stats?.total_weight_lost_kg !== undefined
                ? formatNumberPt(stats.total_weight_lost_kg, 1, 1) ?? "0,0"
                : "0,0"}
              <span className="text-lg"> kg</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Soma da diferença de peso de todos os pacientes (primeira vs última
              sessão).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ativadores Mais Utilizados</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.activators_usage && stats.activators_usage.length > 0 ? (
              <ActivatorsChart data={stats.activators_usage} />
            ) : (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                Nenhum ativador utilizado ainda
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medicação Preferencial Mais Optada</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.medications_preference &&
            stats.medications_preference.length > 0 ? (
              <MedicationsChart data={stats.medications_preference} />
            ) : (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                Nenhuma medicação preferencial registrada ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
