import { SettingsSeoIntro } from "@/components/dashboard/SettingsSeoIntro";
import { SettingsPageClient } from "./SettingsPageClient";

export default function SettingsPage() {
  return (
    <>
      <SettingsSeoIntro section="header" />
      <SettingsPageClient />
      <SettingsSeoIntro section="footer" />
    </>
  );
}
