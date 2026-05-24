import { redirect } from "next/navigation";

export default function CommunitiesRedirectPage() {
  redirect("/dashboard/discussions");
}
