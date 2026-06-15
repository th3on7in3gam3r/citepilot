import { site } from "@/lib/site";
import {
  FLEET_API_RATE_LIMIT_PER_HOUR,
  FLEET_API_RATE_LIMIT_PER_MINUTE,
  FLEET_AUDIT_TRIGGER_LIMIT_PER_HOUR,
  FLEET_API_KEY_PREFIX,
} from "@/lib/fleet/constants";

export const API_BASE = `${site.url}/api/v1`;

export type CodeSample = {
  curl: string;
  node: string;
  python: string;
};

export type ApiDocsEndpoint = {
  method: "GET" | "POST" | "DELETE";
  path: string;
  title: string;
  description: string;
  status?: "live" | "planned";
  requestBody?: string;
  responseExample?: string;
  samples?: CodeSample;
};

export type ApiDocsSection = {
  id: string;
  title: string;
  badge?: "coming-soon";
  intro?: string;
  body?: string;
  endpoints?: ApiDocsEndpoint[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
  samples?: CodeSample;
  jsonExample?: string;
};

const WS = "ws_abc123";

export const apiDocsSections: ApiDocsSection[] = [
  {
    id: "authentication",
    title: "Authentication",
    intro:
      "Fleet plan required. Generate an API key in Dashboard → Settings → Fleet → API Keys (one key per workspace).",
    bullets: [
      "Keys are scoped to the workspace where they were created.",
      "The full secret is shown once at creation — store it in your secrets manager.",
      "Revoke compromised keys immediately from Fleet settings.",
    ],
    samples: {
      curl: `curl -s "${API_BASE}/workspaces" \\
  -H "Authorization: Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY" \\
  -H "Content-Type: application/json"`,
      node: `const res = await fetch("${API_BASE}/workspaces", {
  headers: {
    Authorization: "Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY",
    "Content-Type": "application/json",
  },
});
const data = await res.json();`,
      python: `import requests

r = requests.get(
    "${API_BASE}/workspaces",
    headers={
        "Authorization": "Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY",
        "Content-Type": "application/json",
    },
)
print(r.json())`,
    },
  },
  {
    id: "workspaces",
    title: "Workspaces",
    endpoints: [
      {
        method: "GET",
        path: "/workspaces",
        title: "List workspaces",
        description: "Returns all client workspaces for the authenticated Fleet account.",
        status: "live",
        responseExample: `{
  "workspaces": [
    {
      "id": "${WS}",
      "domain": "client.com",
      "buyerQuestion": "Best CRM for agencies?",
      "citationScore": 62
    }
  ]
}`,
        samples: {
          curl: `curl -s "${API_BASE}/workspaces" \\
  -H "Authorization: Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY"`,
          node: `const res = await fetch("${API_BASE}/workspaces", {
  headers: { Authorization: "Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY" },
});`,
          python: `requests.get("${API_BASE}/workspaces", headers={"Authorization": "Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY"})`,
        },
      },
    ],
  },
  {
    id: "prompts",
    title: "Prompts",
    endpoints: [
      {
        method: "GET",
        path: "/workspaces/{id}/prompts",
        title: "List monitored prompts",
        description: "Money prompts tracked for weekly rescans and citation audits.",
        status: "live",
        samples: {
          curl: `curl -s "${API_BASE}/workspaces/${WS}/prompts" \\
  -H "Authorization: Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY"`,
          node: `await fetch("${API_BASE}/workspaces/${WS}/prompts", {
  headers: { Authorization: "Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY" },
});`,
          python: `requests.get("${API_BASE}/workspaces/${WS}/prompts", headers=headers)`,
        },
      },
      {
        method: "POST",
        path: "/workspaces/{id}/prompts",
        title: "Add prompt(s)",
        description: "Append one or more prompts to the monitored list (respects plan limits).",
        status: "live",
        requestBody: `{ "prompt": "Best agency CRM for client reporting?" }`,
        samples: {
          curl: `curl -s -X POST "${API_BASE}/workspaces/${WS}/prompts" \\
  -H "Authorization: Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"Best agency CRM for client reporting?"}'`,
          node: `await fetch("${API_BASE}/workspaces/${WS}/prompts", {
  method: "POST",
  headers: {
    Authorization: "Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prompt: "Best agency CRM for client reporting?" }),
});`,
          python: `requests.post(
    "${API_BASE}/workspaces/${WS}/prompts",
    headers=headers,
    json={"prompt": "Best agency CRM for client reporting?"},
)`,
        },
      },
      {
        method: "POST",
        path: "/workspaces/{id}/prompts/import",
        title: "Bulk CSV import",
        description:
          "Replace monitored prompts from CSV (`prompt` column or one prompt per line). Multipart file upload or raw CSV body.",
        status: "live",
        samples: {
          curl: `curl -s -X POST "${API_BASE}/workspaces/${WS}/prompts/import" \\
  -H "Authorization: Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY" \\
  -F "file=@prompts.csv"`,
          node: `const form = new FormData();
form.append("file", file);
await fetch("${API_BASE}/workspaces/${WS}/prompts/import", {
  method: "POST",
  headers: { Authorization: "Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY" },
  body: form,
});`,
          python: `requests.post(
    "${API_BASE}/workspaces/${WS}/prompts/import",
    headers={"Authorization": "Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY"},
    files={"file": open("prompts.csv", "rb")},
)`,
        },
      },
    ],
  },
  {
    id: "audits",
    title: "Audits",
    endpoints: [
      {
        method: "GET",
        path: "/workspaces/{id}/audits",
        title: "List audit history",
        description: "Recent citation audits for a workspace. Optional `?limit=20` (max 50).",
        status: "live",
        samples: {
          curl: `curl -s "${API_BASE}/workspaces/${WS}/audits?limit=10" \\
  -H "Authorization: Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY"`,
          node: `await fetch("${API_BASE}/workspaces/${WS}/audits?limit=10", {
  headers: { Authorization: "Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY" },
});`,
          python: `requests.get("${API_BASE}/workspaces/${WS}/audits", headers=headers, params={"limit": 10})`,
        },
      },
      {
        method: "POST",
        path: "/workspaces/{id}/audits",
        title: "Trigger a new audit",
        description:
          "Runs a live citation audit against all monitored prompts. Limited to 10 triggers/hour (see Rate limits).",
        status: "live",
        samples: {
          curl: `curl -s -X POST "${API_BASE}/workspaces/${WS}/audits" \\
  -H "Authorization: Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY"`,
          node: `await fetch("${API_BASE}/workspaces/${WS}/audits", {
  method: "POST",
  headers: { Authorization: "Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY" },
});`,
          python: `requests.post("${API_BASE}/workspaces/${WS}/audits", headers=headers)`,
        },
      },
      {
        method: "GET",
        path: "/audits/{auditId}/results",
        title: "Get audit results",
        description: "Full prompt-level results, platform coverage, gaps, and site signals for one audit run.",
        status: "live",
        samples: {
          curl: `curl -s "${API_BASE}/audits/audit_xyz/results" \\
  -H "Authorization: Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY"`,
          node: `await fetch("${API_BASE}/audits/audit_xyz/results", {
  headers: { Authorization: "Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY" },
});`,
          python: `requests.get("${API_BASE}/audits/audit_xyz/results", headers=headers)`,
        },
      },
    ],
  },
  {
    id: "reports",
    title: "Reports",
    endpoints: [
      {
        method: "GET",
        path: "/reports/{workspaceId}",
        title: "Proof report JSON",
        description:
          "Stakeholder-ready proof report data: citation summary, platform rows, prompt results, benchmark, and recommended actions.",
        status: "live",
        responseExample: `{
  "schemaVersion": 1,
  "workspaceId": "${WS}",
  "summary": { "citationScore": 62, "promptsTracked": 8 },
  "promptRows": [],
  "topActions": ["Publish comparison page for …"]
}`,
        samples: {
          curl: `curl -s "${API_BASE}/reports/${WS}" \\
  -H "Authorization: Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY"`,
          node: `await fetch("${API_BASE}/reports/${WS}", {
  headers: { Authorization: "Bearer ${FLEET_API_KEY_PREFIX}YOUR_KEY" },
});`,
          python: `requests.get("${API_BASE}/reports/${WS}", headers=headers)`,
        },
      },
    ],
  },
  {
    id: "webhooks",
    title: "Webhooks",
    badge: "coming-soon",
    intro:
      "Webhook delivery for audit completion and citation changes is on the roadmap. Register endpoints in Fleet settings (coming soon).",
    bullets: [
      "audit.completed — fired when a workspace audit finishes",
      "citation.change_detected — score or platform coverage moved after a re-scan",
      "prompt.limit_reached — monitored prompt count hit plan cap",
    ],
  },
  {
    id: "rate-limits",
    title: "Rate limits",
    table: {
      headers: ["Scope", "Limit"],
      rows: [
        ["Fleet API (all endpoints)", `${FLEET_API_RATE_LIMIT_PER_MINUTE} requests/min`],
        ["Fleet API (all endpoints)", `${FLEET_API_RATE_LIMIT_PER_HOUR} requests/hour`],
        ["POST /workspaces/{id}/audits", `${FLEET_AUDIT_TRIGGER_LIMIT_PER_HOUR} triggers/hour`],
      ],
    },
    bullets: [
      "Response headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
      "Minute-level headers: X-RateLimit-Limit-Minute, X-RateLimit-Remaining-Minute",
      "429 responses include code RATE_LIMIT or AUDIT_LIMIT with resetAt timestamp",
    ],
  },
  {
    id: "errors",
    title: "Errors",
    body: "All errors return JSON with a consistent shape:",
    jsonExample: `{
  "error": "Prompt limit exceeded for your plan",
  "code": "PROMPT_LIMIT_EXCEEDED",
  "status": 429
}`,
    table: {
      headers: ["Code", "HTTP", "Description"],
      rows: [
        ["UNAUTHORIZED", "401", "Missing or invalid API key / session"],
        ["FLEET_REQUIRED", "403", "Active Fleet subscription required"],
        ["WORKSPACE_SCOPE", "403", "Key scoped to a different workspace"],
        ["NOT_FOUND", "404", "Workspace, audit, or report not found"],
        ["VALIDATION_ERROR", "400", "Invalid request body or missing fields"],
        ["PROMPT_LIMIT_EXCEEDED", "429", "Monitored prompt cap reached"],
        ["RATE_LIMIT", "429", "Fleet API rate limit exceeded"],
        ["AUDIT_LIMIT", "429", "Audit trigger limit exceeded (10/hour)"],
        ["KEY_LIMIT", "400", "Maximum API keys for this workspace"],
        ["INTERNAL_ERROR", "500", "Unexpected server error"],
      ],
    },
  },
];

export const apiDocsLanding = {
  path: "/docs/api",
  title: "CitePilot Fleet API",
  shortTitle: "API documentation",
  description:
    "Integrate citation monitoring into your agency stack. Fleet plan required — REST JSON API with workspace-scoped keys.",
} as const;

// errors section uses jsonExample above

export const apiDocsNav = apiDocsSections.map((s) => ({
  id: s.id,
  title: s.title,
  badge: s.badge,
}));
