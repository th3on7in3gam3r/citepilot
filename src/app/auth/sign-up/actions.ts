"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export async function signUpWithEmail(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  if (!auth) {
    return { error: "Neon Auth is not configured on this server" };
  }

  const email = (formData.get("email") as string)?.trim();
  if (!email) {
    return { error: "Email is required" };
  }

  const { error } = await auth.signUp.email({
    email,
    name: (formData.get("name") as string) || email.split("@")[0] || "User",
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message ?? "Could not create account" };
  }

  redirect("/start");
}
