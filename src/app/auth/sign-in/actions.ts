"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export async function signInWithEmail(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  if (!auth) {
    return { error: "Neon Auth is not configured on this server" };
  }

  const rememberMe = formData.get("rememberMe") === "on";

  const { error } = await auth.signIn.email({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    rememberMe,
  });

  if (error) {
    return { error: error.message ?? "Sign in failed" };
  }

  const from = formData.get("from") as string | null;
  redirect(from && from.startsWith("/") ? from : "/dashboard");
}
