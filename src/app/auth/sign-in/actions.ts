"use server";

import { auth, getRealSessionUser } from "@/lib/auth/server";
import { resolveAuthRedirect } from "@/lib/auth/redirect";
import { redirect } from "next/navigation";
import { isTotpEnabledForUser } from "@/lib/security/totp-store";
import { isTwoFactorVerified } from "@/lib/security/totp-session";

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

  const destination = resolveAuthRedirect(formData.get("from") as string | null);

  const session = await getRealSessionUser();
  if (
    session?.id &&
    (await isTotpEnabledForUser(session.id)) &&
    !(await isTwoFactorVerified(session.id))
  ) {
    redirect(`/auth/2fa?from=${encodeURIComponent(destination)}`);
  }

  redirect(destination);
}
