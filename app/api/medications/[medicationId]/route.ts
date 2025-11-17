import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:8000";
const TOKEN_COOKIE_NAME = "ppe_access_token";

type RouteContext = {
  params: Promise<{
    medicationId: string;
  }>;
};

function extractMedicationId(
  request: NextRequest,
  medicationId?: string,
): string | undefined {
  if (medicationId) {
    return medicationId;
  }

  const pathSegments = request.nextUrl.pathname.split("/").filter(Boolean);
  const lastSegment = pathSegments.at(-1);

  if (!lastSegment || lastSegment === "medications") {
    return undefined;
  }

  return lastSegment;
}

function validateParam(medicationId?: string): NextResponse | null {
  if (!medicationId) {
    return NextResponse.json(
      { detail: "ID da medicação é obrigatório." },
      { status: 400 },
    );
  }

  return null;
}

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const medicationId = extractMedicationId(
    request,
    params?.medicationId,
  );
  const paramError = validateParam(medicationId);
  if (paramError) {
    return paramError;
  }

  const tokenResult = await getTokenOrResponse();
  if (tokenResult instanceof NextResponse) {
    return tokenResult;
  }
  const token = tokenResult;

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
      { detail: "Dados de atualização inválidos." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${BACKEND_API_URL}/medications/${medicationId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        errorData ?? { detail: "Não foi possível atualizar a medicação." },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Comentário em pt-BR: log local para debug
    console.error("Erro ao atualizar medicação:", error);

    return NextResponse.json(
      {
        detail:
          "Erro ao conectar com o servidor de medicações. Tente novamente.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const medicationId = extractMedicationId(
    request,
    params?.medicationId,
  );
  const paramError = validateParam(medicationId);
  if (paramError) {
    return paramError;
  }

  const tokenResult = await getTokenOrResponse();
  if (tokenResult instanceof NextResponse) {
    return tokenResult;
  }
  const token = tokenResult;

  try {
    const response = await fetch(
      `${BACKEND_API_URL}/medications/${medicationId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        errorData ?? { detail: "Não foi possível remover a medicação." },
        { status: response.status },
      );
    }

    if (response.status === 204) {
      return NextResponse.json({ success: true });
    }

    const data = await response.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao remover medicação:", error);

    return NextResponse.json(
      {
        detail:
          "Erro ao conectar com o servidor de medicações. Tente novamente.",
      },
      { status: 500 },
    );
  }
}


