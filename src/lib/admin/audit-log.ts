import { dbRun } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function logAdminAction(input: {
  adminId: string;
  adminEmail: string;
  action: string;
  targetUserId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await dbRun(
    `INSERT INTO admin_audit_log (id, admin_id, admin_email, action, target_user_id, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      input.adminId,
      input.adminEmail,
      input.action,
      input.targetUserId ?? null,
      JSON.stringify(input.metadata ?? {}),
      new Date().toISOString(),
    ],
  );
}
