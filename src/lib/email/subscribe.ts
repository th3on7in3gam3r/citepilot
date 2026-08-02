import { isEmailConfigured, resendApiKey } from "@/lib/email/config";

export async function subscribeToNewsletter(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "Newsletter not configured" };
  }

  const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID?.trim();
  const body: Record<string, unknown> = {
    email,
    unsubscribed: false,
  };
  if (segmentId) {
    body.segments = [{ id: segmentId }];
  }

  const res = await fetch("https://api.resend.com/contacts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.ok) return { ok: true };

  const payload = (await res.json().catch(() => null)) as {
    message?: string;
    name?: string;
  } | null;

  const message = payload?.message?.toLowerCase() ?? "";
  if (
    res.status === 409 ||
    message.includes("already") ||
    message.includes("exists") ||
    message.includes("duplicate")
  ) {
    return { ok: true };
  }

  return {
    ok: false,
    error: payload?.message ?? "Could not subscribe",
  };
}
