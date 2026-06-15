import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary area="dashboard">
      <DashboardShell>{children}</DashboardShell>
    </ErrorBoundary>
  );
}
