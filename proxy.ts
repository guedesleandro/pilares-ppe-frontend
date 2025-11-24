import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const TOKEN_COOKIE_NAME = "ppe_access_token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  // protege o dashboard - se não houver token, redireciona para /login
  if (pathname.startsWith("/dashboard") && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Comentário em pt-BR: se usuário autenticado tentar acessar /login, redireciona para /dashboard
  if (pathname === "/login" && token) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/login"],
};

