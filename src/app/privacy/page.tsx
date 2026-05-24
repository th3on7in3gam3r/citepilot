import { LegalDocument } from "@/components/legal/LegalDocument";
import { privacyPolicy } from "@/lib/legal";
import { site } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects, uses, and protects your data.`,
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
