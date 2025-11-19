import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000";
const TOKEN_COOKIE_NAME = "ppe_access_token";

export type ActivatorUsageItem = {
  name: string;
  count: number;
};

export type MedicationPreferenceItem = {
  name: string;
  count: number;
};

export type DashboardStatsResponse = {
  total_patients: number;
  sessions_last_30_days: number;
  total_weight_lost_kg: number;
  activators_usage: ActivatorUsageItem[];
  medications_preference: MedicationPreferenceItem[];
};

// Comentário em pt-BR: helper para Server Components carregarem estatísticas do dashboard
export async function getDashboardStats(): Promise<DashboardStatsResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Falha ao carregar estatísticas do dashboard:", response.statusText);
      return null;
    }

    return (await response.json()) as DashboardStatsResponse;
  } catch (error) {
    console.error("Erro inesperado ao carregar estatísticas do dashboard:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { detail: "Não autenticado. Faça login para continuar." },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        errorData ?? {
          detail: "Não foi possível carregar as estatísticas do dashboard.",
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao carregar estatísticas do dashboard:", error);
    return NextResponse.json(
      {
        detail: "Erro ao conectar com o servidor. Tente novamente.",
      },
      { status: 500 },
    );
  }
}

