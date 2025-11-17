import { redirect } from "next/navigation";

import { getServerAuthToken } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const token = await getServerAuthToken();

  if (token) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <LoginForm />
    </div>
  );
}


