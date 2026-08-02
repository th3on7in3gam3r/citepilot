import { notFound, redirect } from "next/navigation";
import { AdminSetupGate } from "@/components/admin/AdminSetupGate";
import { adminEmailsFromEnv, getAdminSession } from "@/lib/admin/auth";
import { getRealSessionUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let admin;
  try {
    admin = await getAdminSession();
  } catch {
    redirect("/auth/sign-in?from=/admin");
  }
  if (admin) return children;

  let user;
  try {
    user = await getRealSessionUser();
  } catch {
    redirect("/auth/sign-in?from=/admin");
  }
  if (!user) {
    redirect("/auth/sign-in?from=/admin");
  }

  if (adminEmailsFromEnv().length === 0) {
    return <AdminSetupGate signedInEmail={user.email} />;
  }

  notFound();
}
