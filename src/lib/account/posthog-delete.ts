/** Best-effort GDPR person deletion in PostHog. */
export async function deletePostHogPerson(distinctId: string): Promise<void> {
  const personalKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  if (!personalKey) return;

  const base = (
    process.env.POSTHOG_HOST?.trim() ||
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ||
    "https://us.i.posthog.com"
  ).replace(/\/$/, "");

  try {
    await fetch(`${base}/api/projects/@current/persons`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${personalKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ distinct_ids: [distinctId] }),
    });
  } catch (error) {
    console.error("[account] PostHog delete failed", error);
  }
}
