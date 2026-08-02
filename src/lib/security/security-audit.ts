import { logAdminAction } from "@/lib/admin/audit-log";

export async function logSecurityEvent(input: {
  userId: string;
  email: string;
  action: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await logAdminAction({
    adminId: input.userId,
    adminEmail: input.email,
    action: input.action,
    targetUserId: input.userId,
    metadata: input.metadata,
  });
}
