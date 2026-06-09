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
      <div className="rounded-2xl border border-[#e8edf3] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#64748b]">
            <span className="flex items-center gap-1">
              Completion
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#e2e8f0] text-[10px]">
                i
              </span>
            </span>
            <span className="font-semibold text-[#0f172a]">{completion}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef2f6]">
            <div
              className="h-full rounded-full bg-[#0ea5e9] transition-all duration-300"
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
          ? "border-l-[3px] border-[#0ea5e9] bg-[#e0f2fe] pl-[9px] font-semibold text-[#0284c7]"
          : "border-l-[3px] border-transparent font-medium text-[#64748b] hover:bg-[#f8fafb] hover:text-[#0f172a]"
      }`}
    >
      <SiteDetailsIcon
        icon={section.icon}
        className={`h-4 w-4 shrink-0 ${active ? "text-[#0ea5e9]" : completed ? "text-[#0ea5e9]/70" : "text-[#94a3b8]"}`}
      />
      <span className="min-w-0 flex-1 truncate">{section.label}</span>
      {completed && (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e0f2fe] text-[11px] font-bold text-[#0284c7]"
          aria-label="Complete"
        >
          ✓
        </span>
      )}
    </button>
  );
}
