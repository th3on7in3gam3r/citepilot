import { FLEET_API_RATE_LIMIT_PER_HOUR } from "@/lib/fleet/constants";
import { site } from "@/lib/site";

export const apiDocsLanding = {
  path: "/docs/api",
  title: "CitePilot Fleet API",
  shortTitle: "API documentation",
  description:
    "Programmatic access to workspace citation intelligence. Fleet plan required. Authenticate with API keys or session cookies.",
} as const;

export const apiDocsSections = [
  {
    id: "auth",
    title: "Authentication",
    body: `Fleet API access requires an active Fleet subscription. Create API keys in Dashboard → Settings → Fleet.

Send your key as a Bearer token or \`X-API-Key\` header:

\`\`\`bash
curl -s "${site.url}/api/workspaces/{workspaceId}/export" \\
  -H "Authorization: Bearer cp_fleet_YOUR_KEY"
\`\`\`

Session cookies from a signed-in Fleet user also work for browser and server-side calls with \`credentials: include\`.`,
  },
  {
    id: "export",
    title: "Export workspace intelligence",
    body: `**GET** \`/api/workspaces/{workspaceId}/export\`

Returns JSON with citation score, platform rows, prompt results, competitor benchmark, alerts, and top actions.

| Query | Description |
|-------|-------------|
| \`download=1\` | Sets \`Content-Disposition\` attachment header |

**Rate limit:** ${FLEET_API_RATE_LIMIT_PER_HOUR} requests/hour per API key or session.

**Response headers:**
- \`X-CitePilot-Auth\`: \`api-key\` or \`session\`
- \`Cache-Control\`: \`private, no-store\``,
  },
  {
    id: "keys",
    title: "Manage API keys",
    body: `**GET** \`/api/fleet/api-keys\` — list keys (prefix only, never full secret)

**POST** \`/api/fleet/api-keys\` — create key
\`\`\`json
{ "name": "Production export" }
\`\`\`
Response includes \`key.secret\` once — store it immediately.

**DELETE** \`/api/fleet/api-keys/{id}\` — revoke key`,
  },
  {
    id: "schema",
    title: "Export schema (v1)",
    body: `\`\`\`json
{
  "schemaVersion": 1,
  "generatedAt": "ISO-8601",
  "workspaceId": "uuid",
  "domain": "example.com",
  "summary": {
    "citationScore": 62,
    "visibilityScore": 55,
    "citedPlatforms": 3,
    "totalPlatforms": 8,
    "promptsTracked": 5
  },
  "workspace": { },
  "platformRows": [ ],
  "promptRows": [ ],
  "benchmark": { },
  "alerts": [ ],
  "correlations": [ ],
  "topActions": [ "string" ]
}
\`\`\``,
  },
  {
    id: "errors",
    title: "Errors",
    body: `| Status | Meaning |
|--------|---------|
| 401 | Missing or invalid auth |
| 403 | Fleet plan required |
| 404 | Workspace not found or no access |
| 429 | Hourly rate limit exceeded |`,
  },
] as const;
