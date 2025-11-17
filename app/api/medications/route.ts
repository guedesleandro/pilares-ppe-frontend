import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:8000";
const TOKEN_COOKIE_NAME = "ppe_access_token";

export type Medication = {
  id: string;
  name: string;
  created_at: string;
};

// Comentário em pt-BR: função auxiliar para uso em Server Components
// Retorna os dados diretamente sem NextResponse
export async function getMedications(): Promise<Medication[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return [];
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/medications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Falha ao carregar medicações:", response.statusText);
      return [];
    }

    const data = (await response.json()) as Medication[];
    return data;
  } catch (error) {
    console.error("Erro inesperado ao carregar medicações:", error);
    return [];
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { detail: "Não autenticado. Faça login para continuar." },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/medications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        errorData ?? {
          detail: "Não foi possível carregar as medicações.",
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Comentário em pt-BR: log simples para facilitar o debug local
    console.error("Erro ao listar medicações:", error);

    return NextResponse.json(
      {
        detail:
          "Erro ao conectar com o servidor de medicações. Tente novamente em instantes.",
      },
      { status: 500 },
    );
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

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json(
      { detail: "Dados de criação inválidos." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/medications`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        errorData ?? { detail: "Não foi possível criar a medicação." },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    // Comentário em pt-BR: log local para debug
    console.error("Erro ao criar medicação:", error);

    return NextResponse.json(
      {
        detail:
          "Erro ao conectar com o servidor de medicações. Tente novamente.",
      },
      { status: 500 },
    );
  }
}


