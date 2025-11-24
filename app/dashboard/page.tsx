import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats, getWeightLossRanking, getWeightGainRanking, getMedicationDosage } from "@/lib/api";
import { formatNumberPt } from "@/lib/utils";
import { ActivatorsChart } from "@/components/dashboard/activators-chart";
import { MedicationsChart } from "@/components/dashboard/medications-chart";
import { GenderChart } from "@/components/dashboard/gender-chart";
import { TreatmentLocationChart } from "@/components/dashboard/treatment-location-chart";
import { WeightLossRankingTable } from "@/components/dashboard/weight-loss-ranking-table";
import { WeightGainRankingTable } from "@/components/dashboard/weight-gain-ranking-table";
import { MedicationDosageTable } from "@/components/dashboard/medication-dosage-table";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const lossRanking = await getWeightLossRanking();
  const gainRanking = await getWeightGainRanking();
  const medicationDosage = await getMedicationDosage();

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid gap-6 md:grid-cols-4">
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
            <CardTitle>Média de Idade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {stats?.average_age !== null && stats?.average_age !== undefined
                ? formatNumberPt(stats.average_age, 1, 1) ?? "0,0"
                : "-"}
              {stats?.average_age !== null && stats?.average_age !== undefined && (
                <span className="text-lg"> anos</span>
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Idade média de todos os pacientes.
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
            <CardTitle>Distribuição por Gênero</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.gender_distribution && stats.gender_distribution.length > 0 ? (
              <GenderChart data={stats.gender_distribution} />
            ) : (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                Nenhum paciente cadastrado ainda
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Local de Atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.treatment_location_distribution && stats.treatment_location_distribution.length > 0 ? (
              <TreatmentLocationChart data={stats.treatment_location_distribution} />
            ) : (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                Nenhum paciente cadastrado ainda
              </div>
            )}
          </CardContent>
        </Card>

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

      {/* Tabelas de Ranking */}
      <div className="grid gap-6 md:grid-cols-2">
        <WeightLossRankingTable
          data={lossRanking?.items ?? []}
          startDate={lossRanking?.start_date ?? null}
          endDate={lossRanking?.end_date ?? null}
        />
        <WeightGainRankingTable
          data={gainRanking?.items ?? []}
          startDate={gainRanking?.start_date ?? null}
          endDate={gainRanking?.end_date ?? null}
        />
      </div>

      {/* Tabela de Medicação e Dosagem */}
      <MedicationDosageTable
        data={medicationDosage?.items ?? []}
        startDate={medicationDosage?.start_date ?? null}
        endDate={medicationDosage?.end_date ?? null}
      />
    </div>
  );
}
