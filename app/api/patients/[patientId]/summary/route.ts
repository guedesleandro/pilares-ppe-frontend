import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:8000";
const TOKEN_COOKIE_NAME = "ppe_access_token";

export type MedicationSummary = {
  id: string;
  name: string;
  created_at: string;
};

export type BodyCompositionSummary = {
  registered_at: string;
  weight_kg: string;
  fat_percentage: string;
  fat_kg: string;
  muscle_mass_kg: string;
  h2o_percentage: string;
  metabolic_age: number;
  visceral_fat: number;
};

export type ActivatorCompositionSummary = {
  substance_id: string;
  volume_ml: number;
  substance_name: string;
};

export type ActivatorSummary = {
  id: string;
  name: string;
  created_at: string;
  compositions: ActivatorCompositionSummary[];
};

export type SessionBodyComposition = {
  id: string;
  patient_id: string;
  session_id: string;
  weight_kg: string;
  fat_percentage: string;
  fat_kg: string;
  muscle_mass_kg: string;
  h2o_percentage: string;
  metabolic_age: number;
  visceral_fat: number;
  created_at: string;
};

export type SessionDetails = {
  id: string;
  cycle_id: string;
  medication_id: string;
  activator_id: string | null;
  dosage_mg: number | null;
  session_date: string;
  notes: string | null;
  created_at: string;
  medication: MedicationSummary | null;
  activator: ActivatorSummary | null;
  body_composition: SessionBodyComposition | null;
};

export type CycleWithSessions = {
  id: string;
  patient_id: string;
  max_sessions: number;
  periodicity: "weekly" | "biweekly" | "monthly";
  type: "normal" | "maintenance";
  cycle_date: string;
  created_at: string;
  sessions: SessionDetails[];
};

type PatientSummaryBase = {
  id: string;
  name: string;
  process_number: string | null;
  gender: "male" | "female";
  birth_date: string;
  treatment_location: "clinic" | "home";
  status: "active" | "inactive" | "completed";
  preferred_medication: MedicationSummary | null;
  created_at: string;
  first_session_date: string | null;
  last_session_date: string | null;
  body_composition_initial: BodyCompositionSummary | null;
  body_composition_latest: BodyCompositionSummary | null;
};

export type PatientSummary = PatientSummaryBase & {
  cycles: CycleWithSessions[];
};

type RouteContext = {
  params: Promise<{
    patientId: string;
  }>;
};

async function getTokenOrResponse(): Promise<string | NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { detail: "Não autenticado. Faça login para continuar." },
      { status: 401 },
    );
  }

  return token;
}

async function fetchPatientCycles(
  patientId: string,
  token: string,
): Promise<CycleWithSessions[]> {
  try {
    const response = await fetch(
      `${BACKEND_API_URL}/patients/${patientId}/cycles`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error(
        "Falha ao carregar os ciclos do paciente:",
        response.statusText,
      );
      return [];
    }

    return (await response.json()) as CycleWithSessions[];
  } catch (error) {
    console.error("Erro inesperado ao carregar os ciclos do paciente:", error);
    return [];
  }
}

async function fetchPatientSummaryBase(
  patientId: string,
  token: string,
): Promise<PatientSummaryBase | null> {
  try {
    const response = await fetch(
      `${BACKEND_API_URL}/patients/${patientId}/summary`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error(
        "Falha ao carregar o resumo do paciente:",
        response.statusText,
      );
      return null;
    }

    return (await response.json()) as PatientSummaryBase;
  } catch (error) {
    console.error("Erro inesperado ao carregar o resumo do paciente:", error);
    return null;
  }
}

export async function getPatientSummary(
  patientId: string,
): Promise<PatientSummary | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const [summaryBase, cycles] = await Promise.all([
    fetchPatientSummaryBase(patientId, token),
    fetchPatientCycles(patientId, token),
  ]);

  if (!summaryBase) {
    return null;
  }

  return {
    ...summaryBase,
    cycles,
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const patientId = params?.patientId;

  if (!patientId) {
    return NextResponse.json(
      { detail: "ID do paciente é obrigatório." },
      { status: 400 },
    );
  }

  const tokenResult = await getTokenOrResponse();
  if (tokenResult instanceof NextResponse) {
    return tokenResult;
  }

  try {
    const response = await fetch(
      `${BACKEND_API_URL}/patients/${patientId}/summary`,
      {
        headers: {
          Authorization: `Bearer ${tokenResult}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        errorData ?? { detail: "Não foi possível carregar o resumo do paciente." },
        { status: response.status },
      );
    }

    const baseSummary = (await response.json()) as PatientSummaryBase;
    const cycles = await fetchPatientCycles(patientId, tokenResult);
    return NextResponse.json({
      ...baseSummary,
      cycles,
    });
  } catch (error) {
    console.error("Erro ao carregar o resumo do paciente:", error);
    return NextResponse.json(
      {
        detail:
          "Erro ao conectar com o servidor de pacientes. Tente novamente.",
      },
      { status: 500 },
    );
  }
}


