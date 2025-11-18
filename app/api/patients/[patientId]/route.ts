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

export async function DELETE(request: NextRequest, context: RouteContext) {
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
    const response = await fetch(`${BACKEND_API_URL}/patients/${patientId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${tokenResult}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        errorData ?? { detail: "Não foi possível remover o paciente." },
        { status: response.status },
      );
    }

    if (response.status === 204) {
      return NextResponse.json({ success: true });
    }

    const data = await response.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao remover paciente:", error);
    return NextResponse.json(
      {
        detail: "Erro ao conectar com o servidor de pacientes. Tente novamente.",
      },
      { status: 500 },
    );
  }
}


