import { dbRun } from "@/lib/db";
import { randomUUID } from "crypto";

export async function logComplianceEvent(input: {
  userId: string;
  action: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await dbRun(
    `INSERT INTO compliance_log (id, user_id, action, metadata, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      input.userId,
      input.action,
      JSON.stringify(input.metadata ?? {}),
      new Date().toISOString(),
    ],
  );
}
