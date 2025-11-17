import { cookies } from "next/headers";

const TOKEN_COOKIE_NAME = "ppe_access_token";

// Helper SSR para obter o token JWT a partir do cookie httpOnly
export async function getServerAuthToken(): Promise<string | null> {
  // Comentário em pt-BR: em Next 15+ cookies() é assíncrono
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  return token ?? null;
}


