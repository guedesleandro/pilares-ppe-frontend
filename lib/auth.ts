import { cookies } from "next/headers";

const TOKEN_COOKIE_NAME = "ppe_access_token";
const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:8000";

export type CurrentUser = {
  id: string;
  username: string;
  created_at: string;
};

// Helper SSR para obter o token JWT a partir do cookie httpOnly
export async function getServerAuthToken(): Promise<string | null> {
  // Comentário em pt-BR: em Next 15+ cookies() é assíncrono
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  return token ?? null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Comentário em pt-BR: busca os dados do usuário autenticado no backend
  const token = await getServerAuthToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as CurrentUser;
    return data;
  } catch {
    // Comentário em pt-BR: em caso de erro, retornamos null para não quebrar o layout
    return null;
  }
}

