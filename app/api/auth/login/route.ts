import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:8000";

// Rota interna de login - chama o backend e grava o JWT em cookie httpOnly
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { detail: "E-mail e senha são obrigatórios." },
        { status: 400 },
      );
    }

    const body = new URLSearchParams();
    body.set("username", username);
    body.set("password", password);

    const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      let errorDetail = "Credenciais inválidas. Verifique seus dados.";

      try {
        const errorData = await response.json();
        if (typeof errorData?.detail === "string") {
          errorDetail = errorData.detail;
        }
      } catch {
        // Ignora erro ao parsear JSON de erro
      }

      return NextResponse.json({ detail: errorDetail }, { status: 401 });
    }

    const data = (await response.json()) as {
      access_token: string;
      token_type: string;
    };

    if (!data.access_token) {
      return NextResponse.json(
        { detail: "Resposta inválida do servidor de autenticação." },
        { status: 500 },
      );
    }

    const nextResponse = NextResponse.json({ success: true });

    // Define cookie httpOnly com o JWT
    nextResponse.cookies.set("ppe_access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 1440, // 24 horas - deve acompanhar o backend (ACCESS_TOKEN_EXPIRE_MINUTES)
    });

    return nextResponse;
  } catch (error) {
    // Comentário em pt-BR: log simples para facilitar debug em desenvolvimento
    console.error("Erro na rota interna /api/auth/login:", error);

    return NextResponse.json(
      {
        detail:
          "Não foi possível conectar ao servidor de autenticação. Tente novamente em alguns instantes.",
      },
      { status: 500 },
    );
  }
}


