import { redirect } from "next/navigation";

type Props = { params: Promise<{ token: string }> };

/** Legacy URL — canonical proof report lives at /report/proof/[token] */
export default async function LegacyAuditShareRedirect({ params }: Props) {
  const { token } = await params;
  redirect(`/report/proof/${token}`);
}
