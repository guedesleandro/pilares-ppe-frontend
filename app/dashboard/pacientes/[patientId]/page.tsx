import { AlertTriangle, ArrowDownRight, ArrowUpRight } from "lucide-react";

import {
  getPatientSummary,
  type BodyCompositionSummary,
} from "@/app/api/patients/[patientId]/summary/route";
import { PatientActions } from "@/components/patients/patient-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateAge,
  calculateTrend,
  formatDatePt,
  formatNumberPt,
  getInitials,
} from "@/lib/utils";

type PatientDetailPageProps = {
  params: Promise<{
    patientId: string;
  }>;
};

type CompositionField = {
  key: keyof BodyCompositionSummary;
  label: string;
  unit?: string;
  digits?: {
    min: number;
    max: number;
  };
  showTrend?: boolean;
};

const TREATMENT_LOCATION_LABELS: Record<string, string> = {
  clinic: "Clínica",
  home: "Domiciliar",
};

const COMPOSITION_FIELDS: CompositionField[] = [
  {
    key: "weight_kg",
    label: "Peso",
    unit: "kg",
    digits: { min: 1, max: 1 },
    showTrend: true,
  },
  {
    key: "fat_percentage",
    label: "Gordura (%)",
    unit: "%",
    digits: { min: 1, max: 1 },
    showTrend: true,
  },
  {
    key: "fat_kg",
    label: "Gordura (kg)",
    unit: "kg",
    digits: { min: 1, max: 1 },
    showTrend: true,
  },
  {
    key: "muscle_mass_kg",
    label: "Massa muscular",
    unit: "kg",
    digits: { min: 1, max: 1 },
    showTrend: true,
  },
  {
    key: "h2o_percentage",
    label: "H2O",
    unit: "%",
    digits: { min: 1, max: 1 },
    showTrend: true,
  },
  {
    key: "metabolic_age",
    label: "Idade metabólica",
    unit: "anos",
    digits: { min: 0, max: 0 },
    showTrend: true,
  },
  {
    key: "visceral_fat",
    label: "Gordura visceral",
    digits: { min: 0, max: 0 },
    showTrend: true,
  },
];

export default async function PatientDetailPage({
  params,
}: PatientDetailPageProps) {
  const { patientId } = await params;
  const detailHref = `/dashboard/pacientes/${patientId}`;
  const summary = await getPatientSummary(patientId);

  if (!summary) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertTriangle className="size-8 text-amber-500" />
          <div className="space-y-1">
            <p className="text-base font-semibold">
              Não foi possível carregar a ficha do paciente.
            </p>
            <p className="text-sm text-muted-foreground">
              Tente novamente mais tarde ou atualize a página.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href={detailHref}>Recarregar</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const age = calculateAge(summary.birth_date);
  const birthDateLabel = formatDatePt(summary.birth_date);
  const treatmentLocationLabel =
    TREATMENT_LOCATION_LABELS[summary.treatment_location] ?? "Não informado";
  const firstSessionLabel = formatDatePt(summary.first_session_date, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 text-lg font-semibold">
              <AvatarFallback>{getInitials(summary.name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold leading-tight">
                {summary.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {summary.gender === "male" ? "Masculino" : "Feminino"} · { }
                {age !== null && birthDateLabel
                  ? `${birthDateLabel} · ${age} anos`
                  : birthDateLabel ?? "Data de nascimento não informada"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="text-xs uppercase tracking-wide">
                Código do processo
              </p>
              <p className="text-base font-semibold text-foreground text-end">
                {summary.process_number ?? "Não definido"}
              </p>
            </div>
            <PatientActions
              patientId={summary.id}
              patientName={summary.name}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <InfoRow label="Local de tratamento" value={treatmentLocationLabel} />
            <InfoRow
              label="Medicação preferencial"
              value={summary.preferred_medication?.name ?? "Não informada"}
            />
            <InfoRow
              label="Primeira sessão"
              value={firstSessionLabel ?? "Sem sessões registadas"}
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Composição corporal</CardTitle>
        </CardHeader>
        <CardContent>
          <BodyCompositionComparison
            initial={summary.body_composition_initial}
            latest={summary.body_composition_latest}
          />
        </CardContent>
      </Card>
    </div>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="space-y-1 rounded-lg border border-border/60 bg-muted/30 p-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-base font-semibold text-foreground">{value}</dd>
    </div>
  );
}

type BodyCompositionComparisonProps = {
  initial: BodyCompositionSummary | null;
  latest: BodyCompositionSummary | null;
};

function BodyCompositionComparison({
  initial,
  latest,
}: BodyCompositionComparisonProps) {
  const hasAnyData = initial || latest;

  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        <AlertTriangle className="size-5 text-amber-500" />
        Nenhuma composição corporal foi registrada para este paciente.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <CompositionColumn title="Composição inicial" data={initial} />
      <CompositionColumn title="Composição atual" data={latest} compareWith={initial} />
    </div>
  );
}

type CompositionColumnProps = {
  title: string;
  data: BodyCompositionSummary | null;
  compareWith?: BodyCompositionSummary | null;
};

function CompositionColumn({ title, data, compareWith }: CompositionColumnProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 p-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {data?.registered_at ? (
          <p className="text-sm text-muted-foreground">
            Registrado em{" "}
            {formatDatePt(data.registered_at, {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Sem data registrada</p>
        )}
      </div>

      {data ? (
        <dl className="space-y-4">
          {COMPOSITION_FIELDS.map((field) => (
            <CompositionRow
              key={field.key}
              field={field}
              current={data}
              reference={compareWith}
            />
          ))}
        </dl>
      ) : (
        <div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
          Nenhum registro disponível.
        </div>
      )}
    </div>
  );
}

type CompositionRowProps = {
  field: CompositionField;
  current: BodyCompositionSummary;
  reference?: BodyCompositionSummary | null;
};

function CompositionRow({ field, current, reference }: CompositionRowProps) {
  const value = current[field.key];
  const referenceValue = reference?.[field.key];

  const formattedValue = formatMetricValue(value, field);

  const trend = getTrendData(field, value, referenceValue);

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-background/60 p-4">
      <dt className="text-sm font-medium text-muted-foreground">{field.label}</dt>
      <div className="flex flex-wrap items-center gap-2">
        <dd className="text-lg font-semibold text-foreground">{formattedValue}</dd>
        {trend}
      </div>
    </div>
  );
}

function formatMetricValue(
  value: BodyCompositionSummary[keyof BodyCompositionSummary],
  field: CompositionField,
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const digits = field.digits ?? { min: 0, max: 0 };
  const formatted = formatNumberPt(
    value as string | number,
    digits.min,
    digits.max,
  );

  if (!formatted) {
    return "—";
  }

  return field.unit ? `${formatted} ${field.unit}` : formatted;
}

function getTrendData(
  field: CompositionField,
  currentValue: BodyCompositionSummary[keyof BodyCompositionSummary],
  referenceValue?: BodyCompositionSummary[keyof BodyCompositionSummary],
) {
  if (
    field.showTrend === false ||
    referenceValue === null ||
    referenceValue === undefined ||
    referenceValue === ""
  ) {
    return null;
  }

  const currentNumber = toNumber(currentValue);
  const referenceNumber = toNumber(referenceValue);

  if (currentNumber === null) {
    return null;
  }

  const trend = calculateTrend(referenceNumber, currentNumber);

  if (trend.direction === "equal" || Math.abs(trend.difference) < Number.EPSILON) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const digits = field.digits ?? { min: 0, max: 0 };
  const formattedDifference = formatNumberPt(Math.abs(trend.difference), digits.min, digits.max);
  const sign = trend.difference > 0 ? "+" : "-";
  const unitSuffix = field.unit ? ` ${field.unit}` : "";

  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${
        trend.direction === "up" ? "text-destructive" : "text-emerald-600"
      }`}
    >
      {trend.direction === "up" ? (
        <ArrowUpRight className="size-4" />
      ) : (
        <ArrowDownRight className="size-4" />
      )}
      ({sign}
      {formattedDifference}
      {unitSuffix})
    </span>
  );
}

function toNumber(
  value: BodyCompositionSummary[keyof BodyCompositionSummary] | undefined,
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return null;
  }

  return numericValue;
}

