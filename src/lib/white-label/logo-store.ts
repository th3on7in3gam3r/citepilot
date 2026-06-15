import { dbGet, dbRun } from "@/lib/db";

export const MAX_LOGO_BYTES = 500 * 1024;
export const ALLOWED_LOGO_MIME = new Set(["image/png", "image/svg+xml"]);

type LogoRow = {
  workspace_id: string;
  mime_type: string;
  data_base64: string;
  size_bytes: number;
  updated_at: string;
};

export type StoredLogo = {
  mimeType: string;
  buffer: Buffer;
  sizeBytes: number;
  updatedAt: string;
};

export async function getStoredLogo(
  workspaceId: string,
): Promise<StoredLogo | null> {
  const row = await dbGet<LogoRow>(
    `SELECT workspace_id, mime_type, data_base64, size_bytes, updated_at
     FROM white_label_logos WHERE workspace_id = ?`,
    [workspaceId],
  );
  if (!row) return null;
  return {
    mimeType: row.mime_type,
    buffer: Buffer.from(row.data_base64, "base64"),
    sizeBytes: row.size_bytes,
    updatedAt: row.updated_at,
  };
}

export async function saveStoredLogo(input: {
  workspaceId: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!ALLOWED_LOGO_MIME.has(input.mimeType)) {
    return { ok: false, error: "Logo must be PNG or SVG" };
  }
  if (input.buffer.byteLength > MAX_LOGO_BYTES) {
    return { ok: false, error: "Logo must be 500KB or smaller" };
  }

  const now = new Date().toISOString();
  await dbRun(
    `INSERT INTO white_label_logos (workspace_id, mime_type, data_base64, size_bytes, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (workspace_id) DO UPDATE SET
       mime_type = excluded.mime_type,
       data_base64 = excluded.data_base64,
       size_bytes = excluded.size_bytes,
       updated_at = excluded.updated_at`,
    [
      input.workspaceId,
      input.mimeType,
      input.buffer.toString("base64"),
      input.buffer.byteLength,
      now,
    ],
  );

  return { ok: true };
}

export async function deleteStoredLogo(workspaceId: string): Promise<void> {
  await dbRun(`DELETE FROM white_label_logos WHERE workspace_id = ?`, [workspaceId]);
}

export function hasStoredLogoUrl(logoUrl: string): boolean {
  return !logoUrl.trim();
}
