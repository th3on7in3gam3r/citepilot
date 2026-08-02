export type AutomationPlatform = "zapier" | "make";

export type WebhookQuickConnectTemplate = {
  id: string;
  title: string;
  description: string;
  actionHint: string;
  steps: Record<AutomationPlatform, string[]>;
};

export const WEBHOOK_QUICK_CONNECT_TEMPLATES: WebhookQuickConnectTemplate[] = [
  {
    id: "slack",
    title: "Send to Slack",
    description: "Post citation gains and losses to a Slack channel.",
    actionHint: "Slack → Send Channel Message",
    steps: {
      zapier: [
        "In Zapier: New Zap → Trigger: Webhooks by Zapier → Catch Hook. Copy the custom webhook URL.",
        "Paste the URL in CitePilot below → add a signing secret → Save.",
        "Click Send test event — Zapier should show sample fields.",
        "In Zapier: Action → Slack → Send Channel Message. Map fields like prompt, change, and workspace_domain.",
      ],
      make: [
        "In Make: New scenario → Add module: Webhooks → Custom webhook. Copy the webhook URL.",
        "Paste the URL in CitePilot below → add a signing secret → Save.",
        "Click Send test event — Make should receive the sample payload.",
        "Add a Slack module → Create a message using mapped fields from the webhook.",
      ],
    },
  },
  {
    id: "google-sheets",
    title: "Log to Google Sheets",
    description: "Append each citation event as a new row in a spreadsheet.",
    actionHint: "Google Sheets → Create Spreadsheet Row",
    steps: {
      zapier: [
        "In Zapier: New Zap → Trigger: Webhooks by Zapier → Catch Hook. Copy the webhook URL.",
        "Paste the URL in CitePilot below → add a signing secret → Save.",
        "Send test event so Zapier learns your field names.",
        "In Zapier: Action → Google Sheets → Create Spreadsheet Row. Map event, prompt, platform, delta, timestamp.",
      ],
      make: [
        "In Make: New scenario → Webhooks → Custom webhook. Copy the URL.",
        "Paste the URL in CitePilot below → add a signing secret → Save.",
        "Send test event to populate the data structure.",
        "Add Google Sheets → Add a row with mapped webhook fields.",
      ],
    },
  },
  {
    id: "notion",
    title: "Create Notion page",
    description: "Create a Notion page when citations change on a money prompt.",
    actionHint: "Notion → Create Page / Database Item",
    steps: {
      zapier: [
        "In Zapier: New Zap → Trigger: Webhooks by Zapier → Catch Hook. Copy the webhook URL.",
        "Paste the URL in CitePilot below → add a signing secret → Save.",
        "Send test event — confirm Zapier captured flat fields (prompt, change, report_url).",
        "In Zapier: Action → Notion → Create Database Item. Title from prompt, properties from payload fields.",
      ],
      make: [
        "In Make: New scenario → Webhooks → Custom webhook. Copy the URL.",
        "Paste the URL in CitePilot below → add a signing secret → Save.",
        "Send test event to capture the payload structure.",
        "Add Notion → Create a database item using mapped webhook fields.",
      ],
    },
  },
  {
    id: "hubspot",
    title: "Update HubSpot",
    description: "Log citation activity on a contact or create a timeline note.",
    actionHint: "HubSpot → Create Note or Update Contact",
    steps: {
      zapier: [
        "In Zapier: New Zap → Trigger: Webhooks by Zapier → Catch Hook. Copy the webhook URL.",
        "Paste the URL in CitePilot below → add a signing secret → Save.",
        "Send test event so HubSpot action fields are available.",
        "In Zapier: Action → HubSpot → Create Engagement/Note with citation details from the payload.",
      ],
      make: [
        "In Make: New scenario → Webhooks → Custom webhook. Copy the URL.",
        "Paste the URL in CitePilot below → add a signing secret → Save.",
        "Send test event.",
        "Add HubSpot → Create a note or update a record using webhook fields.",
      ],
    },
  },
];

export const PLATFORM_LABELS: Record<AutomationPlatform, string> = {
  zapier: "Zapier",
  make: "Make.com",
};
