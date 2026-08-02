import { redirect } from "next/navigation";

/** Legacy URL — canonical GEO Playbook lives at /tools/geo-playbook */
export default function NurtureRedirectPage() {
  redirect("/tools/geo-playbook");
}
