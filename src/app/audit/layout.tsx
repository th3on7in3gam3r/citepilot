import { ErrorBoundary } from "@/components/errors/ErrorBoundary";

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ErrorBoundary area="audit">{children}</ErrorBoundary>;
}
