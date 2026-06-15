import { hash, compare } from "bcryptjs";
import { randomBytes } from "crypto";
import type { AuditPayload } from "@/lib/api-types";
import { getAuditById } from "@/lib/audit/run-audit";
import { dbGet, dbRun } from "@/lib/db";
import { parsePreferences } from "@/lib/settings";
import { getWorkspaceById } from "@/lib/server/workspace";

import type { WhiteLabelBranding } from "@/lib/white-label/types";
import { buildProofShareUrl } from "@/lib/white-label/domains";
import { brandingFromPreferences } from "@/lib/white-label/theme";

import type { ShareExpiry } from "@/lib/audit/share-social";

export type ShareBranding = WhiteLabelBranding & {
  workspaceId?: string;
};

type ShareRow = {
  token: string;
  audit_id: string;
  workspace_id: string;
  created_at: string;
  expires_at: string | null;
  password_hash: string | null;
};

export type SharedAuditView = {
  token: string;
  audit: AuditPayload;
  domain: string;
  branding: ShareBranding;
  createdAt: string;
  expiresAt: string | null;
  requiresPassword: boolean;
  expired: boolean;
};

export type AuditOgData = {
  domain: string;
  score: number;
  platforms: { name: string; present: boolean }[];
  citedPrompts: number;
  totalPrompts: number;
};

function expiresAtFromMode(expiry: ShareExpiry): string | null {
  if (expiry === "never") return null;
  const days = expiry === "7d" ? 7 : 30;
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function isExpired(expiresAt: string | null): boolean {
  return Boolean(expiresAt && new Date(expiresAt) < new Date());
}

async function loadShareRow(token: string): Promise<ShareRow | null> {
  const row = await dbGet<ShareRow>(
    `SELECT token, audit_id, workspace_id, created_at, expires_at, password_hash
     FROM audit_shares WHERE token = ?`,
    [token],
  );
  return row ?? null;
}

export async function createAuditShare(input: {
  auditId: string;
  workspaceId: string;
  userId: string | null;
  password?: string | null;
  expiry?: ShareExpiry;
}): Promise<{ token: string; url: string } | { error: string }> {
  const ws = await getWorkspaceById(input.workspaceId, input.userId);
  if (!ws) return { error: "Workspace not found" };

  const audit = await getAuditById(input.auditId);
  if (!audit || audit.workspaceId !== input.workspaceId) {
    return { error: "Audit not found for this workspace" };
  }

  const token = randomBytes(24).toString("base64url");
  const now = new Date().toISOString();
  const expiresAt = expiresAtFromMode(input.expiry ?? "never");
  const passwordHash = input.password?.trim()
    ? await hash(input.password.trim(), 10)
    : null;

  await dbRun(
    `INSERT INTO audit_shares (token, audit_id, workspace_id, created_at, expires_at, password_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [token, input.auditId, input.workspaceId, now, expiresAt, passwordHash],
  );

  const prefs = ws.preferences ?? parsePreferences("{}");
  return {
    token,
    url: buildProofShareUrl(token, prefs),
  };
}

export async function verifySharePassword(
  token: string,
  password: string,
): Promise<boolean> {
  const row = await loadShareRow(token);
  if (!row?.password_hash) return true;
  return compare(password, row.password_hash);
}

export async function getAuditOgData(token: string): Promise<AuditOgData | null> {
  const row = await loadShareRow(token);
  if (!row || isExpired(row.expires_at)) return null;

  const audit = await getAuditById(row.audit_id);
  if (!audit) return null;

  const platforms = Array.isArray(audit.platforms)
    ? audit.platforms.map((p) => ({ name: p.name, present: p.present }))
    : [];

  return {
    domain: audit.domain,
    score: audit.score,
    platforms,
    citedPrompts: audit.cited,
    totalPrompts: audit.total,
  };
}

function shareBrandingFromPrefs(
  prefs: ReturnType<typeof parsePreferences>,
  workspaceId: string,
  ws: Awaited<ReturnType<typeof getWorkspaceById>>,
): ShareBranding {
  const base = brandingFromPreferences(prefs.whiteLabel);
  return {
    ...base,
    agencyName: base.agencyName || ws?.businessType || "GEO Audit",
    workspaceId,
  };
}

export async function getSharedAudit(
  token: string,
  options?: { skipPasswordGate?: boolean },
): Promise<SharedAuditView | null> {
  const row = await loadShareRow(token);
  if (!row) return null;

  const expired = isExpired(row.expires_at);
  if (expired) {
    const auditForDomain = await getAuditById(row.audit_id);
    return {
      token: row.token,
      audit: {} as AuditPayload,
      domain: auditForDomain?.domain ?? "",
      branding: {
        agencyName: "",
        logoUrl: "",
        hidePoweredBy: false,
        poweredByMode: "agency_via_citepilot",
        primaryColor: "#0ea5e9",
      },
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      requiresPassword: false,
      expired: true,
    };
  }

  const audit = await getAuditById(row.audit_id);
  if (!audit) return null;

  const ws = await getWorkspaceById(row.workspace_id, null);
  const prefs = ws?.preferences ?? parsePreferences("{}");

  const requiresPassword = Boolean(row.password_hash) && !options?.skipPasswordGate;

  if (requiresPassword) {
    return {
      token: row.token,
      audit: {} as AuditPayload,
      domain: audit.domain,
      branding: shareBrandingFromPrefs(prefs, row.workspace_id, ws),
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      requiresPassword: true,
      expired: false,
    };
  }

  return {
    token: row.token,
    audit,
    domain: audit.domain,
    branding: shareBrandingFromPrefs(prefs, row.workspace_id, ws),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    requiresPassword: false,
    expired: false,
  };
}

export { buildShareTweet, linkedInShareUrl, twitterShareUrl } from "@/lib/audit/share-social";
