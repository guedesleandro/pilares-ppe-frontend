import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:8000";
const TOKEN_COOKIE_NAME = "ppe_access_token";

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
    const response = await fetch(`${BACKEND_API_URL}/substances`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        errorData ?? {
          detail: "Não foi possível carregar as substâncias.",
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Comentário em pt-BR: log simples para facilitar o debug local
    console.error("Erro ao listar substâncias:", error);

    return NextResponse.json(
      {
        detail:
          "Erro ao conectar com o servidor de substâncias. Tente novamente em instantes.",
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
    const response = await fetch(`${BACKEND_API_URL}/substances`, {
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
        errorData ?? { detail: "Não foi possível criar a substância." },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    // Comentário em pt-BR: log local para debug
    console.error("Erro ao criar substância:", error);

    return NextResponse.json(
      {
        detail:
          "Erro ao conectar com o servidor de substâncias. Tente novamente.",
      },
      { status: 500 },
    );
  }
}



