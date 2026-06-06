import { LegalDocument } from "@/components/legal/LegalDocument";
import { privacyPolicy } from "@/lib/legal";
import { site } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy for GEO & AI Citation",
  description:
    "Learn how CitePilot collects, uses, and protects data for GEO audits, citation dashboards, and subscriptions. Read our privacy policy before you sign up.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      intro={`This policy describes how ${site.name} handles information when you use our website, dashboard, audits, and paid features.`}
      sections={privacyPolicy}
    />
  );
}
