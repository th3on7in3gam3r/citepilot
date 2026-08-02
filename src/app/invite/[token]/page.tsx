import { Suspense } from "react";
import { InviteAcceptClient } from "./InviteAcceptClient";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <Suspense fallback={<div className="h-40 w-full max-w-md animate-pulse rounded-2xl bg-surface" />}>
        <InviteAcceptClient token={token} />
      </Suspense>
    </main>
  );
}
