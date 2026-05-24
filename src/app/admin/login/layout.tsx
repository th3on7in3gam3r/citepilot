import { Suspense } from "react";

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<div className="min-h-[100dvh] bg-cream" />}>{children}</Suspense>;
}
