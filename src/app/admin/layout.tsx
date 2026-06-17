import { notFound, redirect } from "next/navigation";
import { AdminSetupGate } from "@/components/admin/AdminSetupGate";
import { adminEmailsFromEnv, getAdminSession } from "@/lib/admin/auth";
import { getRealSessionUser } from "@/lib/auth/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminSession();
  if (admin) return children;

  const user = await getRealSessionUser();
  if (!user) {
    redirect("/auth/sign-in?from=/admin");
  }

  if (adminEmailsFromEnv().length === 0) {
    return <AdminSetupGate signedInEmail={user.email} />;
  }

  notFound();
}
