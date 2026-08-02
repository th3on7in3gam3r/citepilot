import { getRealSessionUser } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/admin/emails";

export { adminEmailsFromEnv, isAdminEmail, isAdminProtectedPath } from "@/lib/admin/emails";

export async function getAdminSession(request?: Request): Promise<{
  id: string;
  email: string;
  name: string;
} | null> {
  const user = await getRealSessionUser(request);
  if (!user?.email || !isAdminEmail(user.email)) return null;
  return user;
}

export async function requireAdminApi(
  request?: Request,
): Promise<{ id: string; email: string; name: string } | Response> {
  const user = await getAdminSession(request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
