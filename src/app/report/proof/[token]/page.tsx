import type { Metadata } from "next";
import { getAuditOgData } from "@/lib/audit/share";
import { PublicProofReportPage } from "@/components/report/PublicProofReportPage";
import { site } from "@/lib/site";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const data = await getAuditOgData(token);
  if (!data) {
    return {
      title: "Proof report",
      robots: { index: false, follow: false },
    };
  }

  const title = `${data.domain} — GEO Score ${data.score}`;
  const description = `Citation proof report for ${data.domain}. ${data.citedPrompts}/${data.totalPrompts} prompts cited across AI platforms.`;
  const ogImage = `/api/og/audit/${token}`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${site.url}/report/proof/${token}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function SharedProofReportRoute({ params }: Props) {
  const { token } = await params;
  return <PublicProofReportPage token={token} />;
}
