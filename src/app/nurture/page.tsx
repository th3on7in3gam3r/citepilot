import { redirect } from "next/navigation";

/** Legacy URL — canonical GEO Playbook lives at /geo-playbook */
export default function NurtureRedirectPage() {
  redirect("/geo-playbook");
}
