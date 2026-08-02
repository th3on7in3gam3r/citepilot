import { isEmailConfigured, resendApiKey } from "@/lib/email/config";

/** Mark contact unsubscribed in Resend audiences (best-effort). */
export async function unsubscribeResendContact(email: string): Promise<void> {
  if (!isEmailConfigured()) return;
  const key = resendApiKey();
  if (!key) return;

  try {
    await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ unsubscribed: true }),
    });
  } catch (error) {
    console.error("[account] Resend unsubscribe failed", error);
  }
}
