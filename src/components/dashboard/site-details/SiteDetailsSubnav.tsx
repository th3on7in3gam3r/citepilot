"use client";

import type { SiteDetailsSection, SiteDetailsSectionId } from "@/lib/site-details-sections";
import { SITE_DETAILS_SECTIONS } from "@/lib/site-details-sections";
import { SiteDetailsIcon } from "@/components/dashboard/site-details/SiteDetailsIcons";

export function SiteDetailsSubnav({
  active,
  completion,
  completedSections,
  onSelect,
}: {
  active: SiteDetailsSectionId;
  completion: number;
  completedSections: Set<SiteDetailsSectionId>;
  onSelect: (id: SiteDetailsSectionId) => void;
}) {
  return (
    <aside className="w-full shrink-0 lg:w-[240px]">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-[#222] dark:bg-[#111]">
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs font-medium text-muted">
            <span className="flex items-center gap-1">
              Completion
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px]">
                i
              </span>
            </span>
            <span className="font-semibold text-ink">{completion}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <nav className="space-y-0.5">
          {SITE_DETAILS_SECTIONS.map((section) => (
            <SubnavItem
              key={section.id}
              section={section}
              active={active === section.id}
              completed={completedSections.has(section.id)}
              onSelect={() => onSelect(section.id)}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}

function SubnavItem({
  section,
  active,
  completed,
  onSelect,
}: {
  section: SiteDetailsSection;
  active: boolean;
  completed: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
        active
          ? "border-l-[3px] border-accent bg-accent/10 pl-[9px] font-semibold text-accent-deep dark:text-accent"
          : "border-l-[3px] border-transparent font-medium text-muted hover:bg-surface hover:text-ink"
      }`}
    >
      <SiteDetailsIcon
        icon={section.icon}
        className={`h-4 w-4 shrink-0 ${active ? "text-accent" : completed ? "text-accent/70" : "text-muted"}`}
      />
      <span className="min-w-0 flex-1 truncate">{section.label}</span>
      {completed && (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-bold text-accent"
          aria-label="Complete"
        >
          ✓
        </span>
      )}
    </button>
  );
}
