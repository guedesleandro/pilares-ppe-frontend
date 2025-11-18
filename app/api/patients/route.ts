import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000";
const TOKEN_COOKIE_NAME = "ppe_access_token";

export type PatientListItem = {
  id: string;
  name: string;
  process_number: string | null;
  gender: "male" | "female";
  age: number;
  current_cycle_number: number;
  last_session_date: string | null;
  created_at: string;
};

export type PatientsListResponse = {
  items: PatientListItem[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
};

type GetPatientsParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

function buildQueryString(params: GetPatientsParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", params.page.toString());
  if (params.pageSize) query.set("page_size", params.pageSize.toString());
  return query.toString();
}

// Comentário em pt-BR: helper para Server Components carregarem pacientes
export async function getPatients(
  params: GetPatientsParams = {},
): Promise<PatientsListResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const queryString = buildQueryString(params);

  try {
    const response = await fetch(
      `${BACKEND_API_URL}/patients/listing${queryString ? `?${queryString}` : ""}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("Falha ao carregar pacientes:", response.statusText);
      return null;
    }

    return (await response.json()) as PatientsListResponse;
  } catch (error) {
    console.error("Erro inesperado ao carregar pacientes:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { detail: "Não autenticado. Faça login para continuar." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_API_URL}/patients`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        errorData ?? {
          detail: "Não foi possível criar o paciente.",
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar paciente:", error);
    return NextResponse.json(
      {
        detail: "Erro ao conectar com o servidor. Tente novamente.",
      },
      { status: 500 },
    );
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

  const { searchParams } = new URL(request.url);

  try {
    const response = await fetch(
      `${BACKEND_API_URL}/patients/listing?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        errorData ?? {
          detail: "Não foi possível carregar os pacientes.",
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao listar pacientes:", error);
    return NextResponse.json(
      {
        detail: "Erro ao conectar com o servidor de pacientes. Tente novamente.",
      },
      { status: 500 },
    );
  }
}


