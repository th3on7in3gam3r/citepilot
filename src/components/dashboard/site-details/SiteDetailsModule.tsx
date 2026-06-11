"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArticleQueuePanel } from "@/components/dashboard/ArticleQueuePanel";
import { CmsConnectionsPanel } from "@/components/dashboard/CmsConnectionsPanel";
import { GenerateArticlePanel } from "@/components/dashboard/GenerateArticlePanel";
import { CompetitorAnalysisGrid } from "@/components/dashboard/competitors/CompetitorAnalysisGrid";
import { DomainInfoSection } from "@/components/dashboard/site-details/DomainInfoSection";
import { GoogleDataSection } from "@/components/dashboard/site-details/GoogleDataSection";
import { KeywordsSection } from "@/components/dashboard/site-details/KeywordsSection";
import { SiteDetailsFooter } from "@/components/dashboard/site-details/SiteDetailsShared";
import { SiteDetailsSubnav } from "@/components/dashboard/site-details/SiteDetailsSubnav";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { buildContentCalendar } from "@/lib/dashboard-data";
import type { ContentCalendarItem } from "@/lib/dashboard-data";
import { buildWeeklyEditorialMix } from "@/lib/content-strategy";
import {
  completedSectionIds,
  computeSiteDetailsCompletion,
  type SiteDetailsCompletionContext,
} from "@/lib/site-details/completion";
import { loadGoogleServices } from "@/lib/site-details/google-services";
import type { SiteDetailsSectionId } from "@/lib/site-details-sections";
import { SITE_DETAILS_SECTIONS } from "@/lib/site-details-sections";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import type { WorkspaceSnapshotResponse } from "@/lib/api-types";
import { effectInit } from "@/lib/react/effect-init";

const VALID_SECTIONS = new Set<SiteDetailsSectionId>(
  SITE_DETAILS_SECTIONS.map((s) => s.id),
);

export function SiteDetailsModule() {
  const router = useRouter();
  const { workspace, ready, applyWorkspace, refresh } = useWorkspaceContext();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<SiteDetailsSectionId>("domain-info");
  const [queueRefreshKey, setQueueRefreshKey] = useState(0);
  const [completionCtx, setCompletionCtx] = useState<SiteDetailsCompletionContext>({});

  useEffect(() => {
    const section = searchParams.get("section");
    if (section && VALID_SECTIONS.has(section as SiteDetailsSectionId)) {
      const t = setTimeout(() => {
        setActive(section as SiteDetailsSectionId);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  const section = SITE_DETAILS_SECTIONS.find((s) => s.id === active)!;
  const workspaceId = workspace?.workspaceId ?? workspace?.id ?? "";

  const refreshCompletionCtx = useCallback(async (id: string) => {
    const googleServices = loadGoogleServices(id);
    let cmsConnected = false;
    let hasGeneratedPost = false;

    try {
      const [cmsRes, postsRes] = await Promise.all([
        fetch(`/api/content/cms?workspaceId=${encodeURIComponent(id)}`, {
          credentials: "include",
        }),
        fetch("/api/blog/posts", { credentials: "include" }),
      ]);
      if (cmsRes.ok) {
        const data = (await cmsRes.json()) as {
          providers?: { connected?: boolean }[];
        };
        cmsConnected = (data.providers ?? []).some((p) => p.connected);
      }
      if (postsRes.ok) {
        const data = (await postsRes.json()) as { posts?: unknown[] };
        hasGeneratedPost = (data.posts?.length ?? 0) > 0;
      }
    } catch {
      /* use partial context */
    }

    setCompletionCtx({ googleServices, cmsConnected, hasGeneratedPost });
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    effectInit(() => {
      void refreshCompletionCtx(workspaceId);
    });
  }, [workspaceId, workspace, refreshCompletionCtx]);

  const completion = useMemo(
    () => (workspace ? computeSiteDetailsCompletion(workspace, completionCtx) : 0),
    [workspace, completionCtx],
  );

  const completedSections = useMemo(
    () =>
      workspace
        ? completedSectionIds(workspace, completionCtx)
        : new Set<SiteDetailsSectionId>(),
    [workspace, completionCtx],
  );

  const goToSection = useCallback(
    (id: SiteDetailsSectionId) => {
      setActive(id);
      router.replace(`/dashboard/content?section=${id}`, { scroll: false });
    },
    [router],
  );

  const advanceSection = useCallback(() => {
    const idx = SITE_DETAILS_SECTIONS.findIndex((s) => s.id === active);
    const next = SITE_DETAILS_SECTIONS[idx + 1];
    if (next) goToSection(next.id);
  }, [active, goToSection]);

  const handleSelectOpportunity = useCallback(
    (params: { topic: string; angle?: string; format?: string; pillar?: string }) => {
      const search = new URLSearchParams();
      search.set("section", "generate");
      if (params.topic) search.set("topic", params.topic);
      if (params.angle) search.set("angle", params.angle);
      if (params.format) search.set("format", params.format);
      if (params.pillar) search.set("pillar", params.pillar);

      setActive("generate");
      router.replace(`/dashboard/content?${search.toString()}`, { scroll: false });
    },
    [router],
  );

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 rounded-2xl bg-white" />
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="h-96 rounded-2xl bg-white" />
          <div className="h-96 rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="rounded-2xl border border-dashed border-[#e2e8f0] bg-white p-12 text-center">
        <p className="font-display text-xl font-bold text-[#0f172a]">No site yet</p>
        <p className="mt-2 text-sm text-[#64748b]">
          Complete onboarding to configure your site details and content workspace.
        </p>
        <Link
          href="/start"
          className="mt-6 inline-flex rounded-full bg-[#0ea5e9] px-6 py-3 text-sm font-semibold text-white"
        >
          Start setup →
        </Link>
      </div>
    );
  }

  function handleSaved(updated?: WorkspaceSnapshotResponse) {
    if (updated) applyWorkspace(updated, workspaceId);
    else void refresh();
    void refreshCompletionCtx(workspaceId);
  }

  return (
    <div className="-mx-4 flex min-h-[calc(100dvh-8rem)] flex-col md:-mx-6 lg:-mx-8">
      <div className="flex flex-1 flex-col gap-5 px-4 md:px-6 lg:flex-row lg:px-8">
        <SiteDetailsSubnav
          active={active}
          completion={completion}
          completedSections={completedSections}
          onSelect={goToSection}
        />

        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-[#e8edf3] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <header className="border-b border-[#eef2f6] px-6 py-5">
              <h2 className="font-display text-xl font-bold text-[#0f172a]">
                {section.label}
              </h2>
              <p className="mt-1 text-sm text-[#64748b]">{section.description}</p>
            </header>

            <div className="px-6 py-6">
              <SectionBody
                section={active}
                workspace={workspace!}
                workspaceId={workspaceId}
                queueRefreshKey={queueRefreshKey}
                onSaved={handleSaved}
                onGenerated={() => {
                  setQueueRefreshKey((k) => k + 1);
                  void refreshCompletionCtx(workspaceId);
                }}
                onContinue={advanceSection}
                onSelectOpportunity={handleSelectOpportunity}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionBody({
  section,
  workspace,
  workspaceId,
  queueRefreshKey,
  onSaved,
  onGenerated,
  onContinue,
  onSelectOpportunity,
}: {
  section: SiteDetailsSectionId;
  workspace: WorkspaceSnapshot;
  workspaceId: string;
  queueRefreshKey: number;
  onSaved: (updated?: WorkspaceSnapshotResponse) => void;
  onGenerated: () => void;
  onContinue: () => void;
  onSelectOpportunity: (params: {
    topic: string;
    angle?: string;
    format?: string;
    pillar?: string;
  }) => void;
}) {
  switch (section) {
    case "domain-info":
      return (
        <DomainInfoSection
          workspace={workspace}
          workspaceId={workspaceId}
          onSaved={onSaved}
          onContinue={onContinue}
        />
      );
    case "pages":
      return (
        <PagesSection
          onContinue={onContinue}
          workspace={workspace}
          onSelectOpportunity={onSelectOpportunity}
        />
      );
    case "google-data":
      return (
        <GoogleDataSection
          workspaceId={workspaceId}
          domain={workspace.domain}
          onContinue={onContinue}
        />
      );
    case "targeting":
      return (
        <DomainInfoSection
          workspace={workspace}
          workspaceId={workspaceId}
          onSaved={onSaved}
          onContinue={onContinue}
          mode="targeting"
        />
      );
    case "competitors":
      return (
        <div className="space-y-8">
          <CompetitorAnalysisGrid workspace={workspace} />
          <div className="border-t border-[#eef2f6] pt-8">
            <p className="mb-4 text-sm font-semibold text-[#0f172a]">Tracked competitors</p>
            <DomainInfoSection
              workspace={workspace}
              workspaceId={workspaceId}
              onSaved={onSaved}
              onContinue={onContinue}
              mode="competitors"
            />
          </div>
        </div>
      );
    case "keywords":
      return <KeywordsSection workspace={workspace} onContinue={onContinue} />;
    case "working-files":
      return (
        <div className="space-y-6">
          <div className="-mx-2">
            <ArticleQueuePanel workspaceId={workspaceId} refreshKey={queueRefreshKey} />
          </div>
          <SiteDetailsFooter
            showSave={false}
            continueLabel="Continue"
            onSaveContinue={onContinue}
          />
        </div>
      );
    case "generate":
      return (
        <div className="space-y-6">
          <GenerateArticlePanel
            workspaceId={workspaceId}
            workspace={workspace}
            onGenerated={onGenerated}
          />
          <SiteDetailsFooter
            showSave={false}
            continueLabel="Continue"
            onSaveContinue={onContinue}
          />
        </div>
      );
    case "cms":
      return (
        <div className="space-y-6">
          <CmsConnectionsPanel workspaceId={workspaceId} onChanged={onGenerated} embedded />
          <SiteDetailsFooter
            showSave={false}
            continueLabel="Continue"
            onSaveContinue={onContinue}
          />
        </div>
      );
    default:
      return null;
  }
}

function PagesSection({
  workspace,
  onContinue,
  onSelectOpportunity,
}: {
  workspace: WorkspaceSnapshot;
  onContinue: () => void;
  onSelectOpportunity: (params: {
    topic: string;
    angle?: string;
    format?: string;
    pillar?: string;
  }) => void;
}) {
  const persistedStrategy =
    workspace.contentStrategy && workspace.contentStrategy.length > 0
      ? workspace.contentStrategy
      : null;
  const calendar: ContentCalendarItem[] =
    persistedStrategy ?? buildContentCalendar(workspace);
  const editorialWeek = buildWeeklyEditorialMix();
  const primaryKeyword = workspace.buyerQuestion || "your primary keyword";

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-[#0f172a]">CitePilot editorial mix</h3>
        <p className="mt-1 text-sm text-[#64748b]">
          Template cadence for your site blog — 3–5 posts/week across GEO pillars.
        </p>
        <ul className="mt-4 divide-y divide-[#eef2f6] text-sm">
          {editorialWeek.map((slot) => (
            <li key={slot.day} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:items-center">
              <div>
                <span className="font-semibold text-[#0f172a]">{slot.day}</span>
                <span className="text-[#64748b]"> · {slot.pillarTitle}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-[#0ea5e9] bg-[#0ea5e9]/5 border border-[#0ea5e9]/10 px-2 py-0.5 rounded-md">
                  {slot.contentType}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onSelectOpportunity({
                      topic: slot.topicTemplate.replace("[primary keyword]", primaryKeyword),
                      format: slot.contentType,
                      pillar: slot.pillarId,
                    })
                  }
                  className="px-2.5 py-1 text-[11px] font-bold text-[#0ea5e9] bg-[#0ea5e9]/5 hover:bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 hover:border-[#0ea5e9]/30 rounded-lg transition-all duration-150 cursor-pointer shadow-sm hover:shadow"
                >
                  Use Template ✦
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-[#0f172a]">30-day content calendar</h3>
        <ul className="mt-4 divide-y divide-[#eef2f6]">
          {calendar.map((c) => (
            <li key={c.week} className="py-4 first:pt-0 flex flex-col justify-between sm:flex-row sm:items-center gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#64748b]">{c.week}</p>
                <p className="font-medium text-[#0f172a]">{c.topic}</p>
                <p className="mt-1 text-xs text-[#64748b]">{c.rationale}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onSelectOpportunity({
                    topic: c.topic,
                    angle: `Rationale: ${c.rationale}`,
                    format: c.format.toLowerCase() === "pillar" ? "pillar" : c.format.toLowerCase() === "comparison" ? "comparison" : "tutorial",
                    pillar: "geo",
                  })
                }
                className="shrink-0 self-start sm:self-center px-3.5 py-1.5 text-xs font-bold text-white bg-[#0f172a] hover:bg-[#1e293b] border border-[#0f172a] rounded-full transition-all duration-150 cursor-pointer shadow-sm hover:shadow"
              >
                Generate Article ✦
              </button>
            </li>
          ))}
        </ul>
      </section>
      <SiteDetailsFooter
        showSave={false}
        continueLabel="Continue"
        onSaveContinue={onContinue}
      />
    </div>
  );
}
