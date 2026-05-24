import { redirect } from "next/navigation";

export default function RedditRedirectPage() {
  redirect("/dashboard/discussions");
}
