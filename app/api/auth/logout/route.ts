import { NextResponse } from "next/server";

// Rota interna de logout - remove o cookie com o JWT
export async function POST() {
  const response = NextResponse.json({ success: true });

  // Comentário em pt-BR: invalidando o cookie do token
  response.cookies.set("ppe_access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}


