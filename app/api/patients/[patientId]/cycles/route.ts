import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:8000";
const TOKEN_COOKIE_NAME = "ppe_access_token";

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

export async function POST(request: NextRequest, context: RouteContext) {
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
      { detail: "Dados de criação do ciclo inválidos." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${BACKEND_API_URL}/patients/${patientId}/cycles`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenResult}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        errorData ?? { detail: "Não foi possível criar o ciclo." },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar ciclo:", error);
    return NextResponse.json(
      {
        detail: "Erro ao conectar com o servidor de ciclos. Tente novamente.",
      },
      { status: 500 },
    );
  }
}


