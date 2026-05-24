import { LegalDocument } from "@/components/legal/LegalDocument";
import { termsOfService } from "@/lib/legal";
import { site } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms governing your use of ${site.name} audits, dashboard, and subscriptions.`,
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      intro={`Please read these terms carefully before using ${site.name}. They apply to free audits, accounts, and paid subscriptions.`}
      sections={termsOfService}
    />
  );
}
