import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { buildContentCalendar } from "@/lib/dashboard-data";
import type { GoogleServiceState } from "@/lib/site-details/google-services";
import {
  SITE_DETAILS_SECTIONS,
  type SiteDetailsSectionId,
} from "@/lib/site-details-sections";

export type SiteDetailsCompletionContext = {
  googleServices?: GoogleServiceState;
  cmsConnected?: boolean;
  hasGeneratedPost?: boolean;
};

export function isSectionComplete(
  sectionId: SiteDetailsSectionId,
  workspace: WorkspaceSnapshot,
  ctx: SiteDetailsCompletionContext = {},
): boolean {
  switch (sectionId) {
    case "domain-info":
      return (
        workspace.domain?.trim().length > 3 &&
        workspace.description?.trim().length > 0 &&
        Boolean(workspace.businessType)
      );
    case "pages":
      return (
        (workspace.contentStrategy?.length ?? 0) > 0 ||
        buildContentCalendar(workspace).length > 0
      );
    case "google-data": {
      const services = ctx.googleServices;
      if (!services) return false;
      return (
        services.analytics || services["search-console"]
      );
    }
    case "targeting":
      return (
        workspace.buyerQuestion?.trim().length > 5 && workspace.audiences.length > 0
      );
    case "working-files":
      return workspace.contentDrafts > 0 || Boolean(ctx.hasGeneratedPost);
    case "generate":
      return workspace.contentDrafts > 0 || Boolean(ctx.hasGeneratedPost);
    case "cms":
      return Boolean(ctx.cmsConnected);
    default:
      return false;
  }
}

export function computeSiteDetailsCompletion(
  workspace: WorkspaceSnapshot,
  ctx: SiteDetailsCompletionContext = {},
): number {
  const total = SITE_DETAILS_SECTIONS.length;
  const completed = SITE_DETAILS_SECTIONS.filter((s) =>
    isSectionComplete(s.id, workspace, ctx),
  ).length;
  return Math.round((completed / total) * 100);
}

export function completedSectionIds(
  workspace: WorkspaceSnapshot,
  ctx: SiteDetailsCompletionContext = {},
): Set<SiteDetailsSectionId> {
  return new Set(
    SITE_DETAILS_SECTIONS.filter((s) =>
      isSectionComplete(s.id, workspace, ctx),
    ).map((s) => s.id),
  );
}
