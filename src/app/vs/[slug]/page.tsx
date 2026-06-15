import { redirect } from "next/navigation";
import { competitors, getCompetitor } from "@/lib/data/competitors";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return competitors.map((c) => ({ slug: c.slug }));
}

/** Legacy /vs/[slug] → /compare/[slug] */
export default async function VsRedirectPage({ params }: Props) {
  const { slug } = await params;
  const competitor = getCompetitor(slug);
  if (!competitor) {
    redirect("/compare/semrush");
  }
  redirect(`/compare/${competitor.slug}`);
}
