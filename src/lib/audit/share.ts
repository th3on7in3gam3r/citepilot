import { randomBytes } from "crypto";
import type { AuditPayload } from "@/lib/api-types";
import { getAuditById } from "@/lib/audit/run-audit";
import { dbGet, dbRun } from "@/lib/db";
import { parsePreferences } from "@/lib/settings";
import { getWorkspaceById } from "@/lib/server/workspace";

type ShareRow = {
  token: string;
  audit_id: string;
  workspace_id: string;
  created_at: string;
  expires_at: string | null;
};

export type SharedAuditView = {
  token: string;
  audit: AuditPayload;
  domain: string;
  branding: {
    agencyName: string;
    logoUrl: string;
    hidePoweredBy: boolean;
  };
  createdAt: string;
};

export async function createAuditShare(input: {
  auditId: string;
  workspaceId: string;
  userId: string | null;
}): Promise<{ token: string; url: string } | { error: string }> {
  const ws = await getWorkspaceById(input.workspaceId, input.userId);
  if (!ws) return { error: "Workspace not found" };

  const audit = await getAuditById(input.auditId);
  if (!audit || audit.workspaceId !== input.workspaceId) {
    return { error: "Audit not found for this workspace" };
  }

  const token = randomBytes(24).toString("base64url");
  const now = new Date().toISOString();

  await dbRun(
    `INSERT INTO audit_shares (token, audit_id, workspace_id, created_at, expires_at)
     VALUES (?, ?, ?, ?, NULL)`,
    [token, input.auditId, input.workspaceId, now],
  );

  const { appBaseUrl } = await import("@/lib/stripe/config");
  return {
    token,
    url: `${appBaseUrl()}/audit/share/${token}`,
  };
}

export async function getSharedAudit(
  token: string,
): Promise<SharedAuditView | null> {
  const row = await dbGet<ShareRow>(
    `SELECT * FROM audit_shares WHERE token = ?`,
    [token],
  );
  if (!row) return null;

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return null;
  }

  const audit = await getAuditById(row.audit_id);
  if (!audit) return null;

  const ws = await getWorkspaceById(row.workspace_id, null);
  const prefs = ws?.preferences ?? parsePreferences("{}");

  return {
    token: row.token,
    audit,
    domain: audit.domain,
    branding: {
      agencyName: prefs.whiteLabel.agencyName || ws?.businessType || "GEO Audit",
      logoUrl: prefs.whiteLabel.logoUrl,
      hidePoweredBy: prefs.whiteLabel.hidePoweredBy,
    },
    createdAt: row.created_at,
  };
}
