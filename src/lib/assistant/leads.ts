import { v4 as uuidv4 } from "uuid";
import { dbRun } from "@/lib/db";

export type AssistantLeadDraftInput = {
  name: string;
  email: string;
  company: string | null;
  intent: string;
  transcript: string | null;
  locale: string | null;
};

export async function insertAssistantLeadDraft(
  input: AssistantLeadDraftInput,
): Promise<{ id: string }> {
  const id = uuidv4();
  const now = new Date().toISOString();
  await dbRun(
    `INSERT INTO assistant_lead_drafts
     (id, name, email, company, intent, transcript, locale, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
    [
      id,
      input.name,
      input.email,
      input.company,
      input.intent,
      input.transcript,
      input.locale,
      now,
    ],
  );
  return { id };
}
