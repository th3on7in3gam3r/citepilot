import { randomUUID } from "crypto";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import { decryptCmsSecret, encryptCmsSecret } from "@/lib/cms/crypto";
import type {
  CmsConnection,
  CmsConnectionRow,
  CmsCredentialsByProvider,
  CmsProvider,
  CmsPublication,
  CmsPublicationRow,
  CmsRemoteDefaultsByProvider,
} from "@/lib/cms/types";

function parseDefaults<P extends CmsProvider>(
  provider: P,
  raw: string | null,
): CmsRemoteDefaultsByProvider[P] {
  if (!raw) return {} as CmsRemoteDefaultsByProvider[P];
  return JSON.parse(raw) as CmsRemoteDefaultsByProvider[P];
}

function rowToConnection<P extends CmsProvider>(
  row: CmsConnectionRow,
): CmsConnection<P> {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    provider: row.provider as P,
    displayName: row.display_name,
    siteUrl: row.site_url,
    status: row.status,
    credentials: JSON.parse(
      decryptCmsSecret(row.credentials_encrypted),
    ) as CmsCredentialsByProvider[P],
    remoteDefaults: parseDefaults(row.provider as P, row.remote_defaults),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToPublication<P extends CmsProvider>(
  row: CmsPublicationRow,
): CmsPublication<P> {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    provider: row.provider as P,
    postSlug: row.post_slug,
    remoteId: row.remote_id,
    remoteUrl: row.remote_url,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

export async function getCmsConnection<P extends CmsProvider>(
  workspaceId: string,
  provider: P,
): Promise<CmsConnection<P> | null> {
  const row = await dbGet<CmsConnectionRow>(
    `SELECT * FROM cms_connections WHERE workspace_id = ? AND provider = ?`,
    [workspaceId, provider],
  );
  return row ? rowToConnection<P>(row) : null;
}

export async function listCmsConnections(
  workspaceId: string,
): Promise<CmsConnection[]> {
  const rows = await dbAll<CmsConnectionRow>(
    `SELECT * FROM cms_connections WHERE workspace_id = ? ORDER BY provider ASC`,
    [workspaceId],
  );
  return rows.map((row) => rowToConnection(row));
}

export async function upsertCmsConnection<P extends CmsProvider>(input: {
  workspaceId: string;
  provider: P;
  displayName: string;
  siteUrl: string;
  status?: string;
  credentials: CmsCredentialsByProvider[P];
  remoteDefaults?: CmsRemoteDefaultsByProvider[P];
}): Promise<CmsConnection<P>> {
  const existing = await getCmsConnection(input.workspaceId, input.provider);
  const now = new Date().toISOString();
  const encrypted = encryptCmsSecret(JSON.stringify(input.credentials));
  const defaults = JSON.stringify(input.remoteDefaults ?? {});

  if (existing) {
    await dbRun(
      `UPDATE cms_connections SET
         display_name = ?, site_url = ?, status = ?, credentials_encrypted = ?,
         remote_defaults = ?, updated_at = ?
       WHERE workspace_id = ? AND provider = ?`,
      [
        input.displayName,
        input.siteUrl,
        input.status ?? "connected",
        encrypted,
        defaults,
        now,
        input.workspaceId,
        input.provider,
      ],
    );
  } else {
    await dbRun(
      `INSERT INTO cms_connections (
         id, workspace_id, provider, display_name, site_url, status,
         credentials_encrypted, remote_defaults, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        input.workspaceId,
        input.provider,
        input.displayName,
        input.siteUrl,
        input.status ?? "connected",
        encrypted,
        defaults,
        now,
        now,
      ],
    );
  }

  return (await getCmsConnection(input.workspaceId, input.provider))!;
}

export async function deleteCmsConnection(
  workspaceId: string,
  provider: CmsProvider,
): Promise<void> {
  await dbRun(
    `DELETE FROM cms_connections WHERE workspace_id = ? AND provider = ?`,
    [workspaceId, provider],
  );
}

export async function getCmsPublication<P extends CmsProvider>(input: {
  workspaceId: string;
  provider: P;
  postSlug: string;
}): Promise<CmsPublication<P> | null> {
  const row = await dbGet<CmsPublicationRow>(
    `SELECT * FROM cms_publications
     WHERE workspace_id = ? AND provider = ? AND post_slug = ?`,
    [input.workspaceId, input.provider, input.postSlug],
  );
  return row ? rowToPublication<P>(row) : null;
}

export async function listCmsPublicationsForPosts(
  workspaceId: string,
  postSlugs: string[],
): Promise<CmsPublication[]> {
  if (postSlugs.length === 0) return [];
  const placeholders = postSlugs.map(() => "?").join(", ");
  const rows = await dbAll<CmsPublicationRow>(
    `SELECT * FROM cms_publications
     WHERE workspace_id = ? AND post_slug IN (${placeholders})`,
    [workspaceId, ...postSlugs],
  );
  return rows.map((row) => rowToPublication(row));
}

export async function upsertCmsPublication<P extends CmsProvider>(input: {
  workspaceId: string;
  provider: P;
  postSlug: string;
  remoteId: string;
  remoteUrl?: string | null;
}): Promise<CmsPublication<P>> {
  const existing = await getCmsPublication({
    workspaceId: input.workspaceId,
    provider: input.provider,
    postSlug: input.postSlug,
  });
  const now = new Date().toISOString();

  if (existing) {
    await dbRun(
      `UPDATE cms_publications SET
         remote_id = ?, remote_url = ?, updated_at = ?
       WHERE workspace_id = ? AND provider = ? AND post_slug = ?`,
      [
        input.remoteId,
        input.remoteUrl ?? null,
        now,
        input.workspaceId,
        input.provider,
        input.postSlug,
      ],
    );
  } else {
    await dbRun(
      `INSERT INTO cms_publications (
         id, workspace_id, provider, post_slug, remote_id, remote_url,
         published_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        input.workspaceId,
        input.provider,
        input.postSlug,
        input.remoteId,
        input.remoteUrl ?? null,
        now,
        now,
      ],
    );
  }

  return (await getCmsPublication({
    workspaceId: input.workspaceId,
    provider: input.provider,
    postSlug: input.postSlug,
  }))!;
}

export async function getCmsPublicationByRemoteId(input: {
  workspaceId: string;
  provider: CmsProvider;
  remoteId: string;
}): Promise<CmsPublication | null> {
  const row = await dbGet<CmsPublicationRow>(
    `SELECT * FROM cms_publications
     WHERE workspace_id = ? AND provider = ? AND remote_id = ?`,
    [input.workspaceId, input.provider, input.remoteId],
  );
  return row ? rowToPublication(row) : null;
}

export async function markCmsPublicationLive(input: {
  workspaceId: string;
  provider: CmsProvider;
  remoteId: string;
  remoteUrl?: string | null;
  publishedAt?: string;
}): Promise<CmsPublication | null> {
  const existing = await getCmsPublicationByRemoteId({
    workspaceId: input.workspaceId,
    provider: input.provider,
    remoteId: input.remoteId,
  });
  if (!existing) return null;
  const now = input.publishedAt || new Date().toISOString();
  await dbRun(
    `UPDATE cms_publications SET
       remote_url = COALESCE(?, remote_url),
       published_at = ?,
       updated_at = ?
     WHERE workspace_id = ? AND provider = ? AND remote_id = ?`,
    [
      input.remoteUrl ?? null,
      now,
      now,
      input.workspaceId,
      input.provider,
      input.remoteId,
    ],
  );
  return getCmsPublicationByRemoteId({
    workspaceId: input.workspaceId,
    provider: input.provider,
    remoteId: input.remoteId,
  });
}
