export type ChangelogEntry = {
  date: string;
  version?: string;
  title: string;
  items: string[];
  tags?: ("feature" | "fix" | "improvement")[];
};

export const changelogEntries: ChangelogEntry[] = [
  {
    date: "2026-06-11",
    version: "0.9.4",
    title: "Marketing & conversion",
    items: [
      "Homepage hero sharpened for AI citation positioning",
      "Product, GEO Playbook, agency, and comparison pages",
      "Free citation checker and citation-gap calculator tools",
      "Public API docs and changelog",
    ],
    tags: ["feature", "improvement"],
  },
  {
    date: "2026-06-10",
    version: "0.9.3",
    title: "Reliability",
    items: [
      "Workspace API resilience for malformed audit data",
      "Workspace delete fixes foreign-key cascade for audit shares",
      "SerpAPI support for Google AI Overviews probes",
    ],
    tags: ["fix", "feature"],
  },
  {
    date: "2026-06-09",
    version: "0.9.2",
    title: "Dashboard polish",
    items: [
      "Citation tracking tiles link to dashboard destinations",
      "Answer capsule moved for GEO extraction on homepage",
      "Sky-blue chart theme across dashboard analytics",
    ],
    tags: ["improvement"],
  },
  {
    date: "2026-06-02",
    version: "0.9.0",
    title: "CitePilot Autopilot",
    items: [
      "Pilot+ weekly rescan with email delta reports",
      "Insights prioritize plan on Autopilot runs",
      "Fleet API keys for workspace JSON export",
    ],
    tags: ["feature"],
  },
];

export const roadmapItems = [
  {
    status: "shipped" as const,
    label: "Weekly citation monitoring & email digests",
  },
  { status: "shipped" as const, label: "CMS publish (Webflow, WordPress, Ghost)" },
  { status: "in_progress" as const, label: "Google Search Console daily series in dashboard" },
  { status: "planned" as const, label: "Slack alerts for competitor citation moves" },
  { status: "planned" as const, label: "Public REST API for audit triggers (Fleet)" },
  { status: "planned" as const, label: "Multi-language money prompt templates" },
];
