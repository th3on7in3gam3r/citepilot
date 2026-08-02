import { dbAll } from "@/lib/db";
import { describe, it } from "vitest";

describe("check logs", () => {
  it("prints cron_dispatch_log and workspace info", async () => {
    const logs = await dbAll("SELECT * FROM cron_dispatch_log ORDER BY created_at DESC LIMIT 50");
    console.log("=== CRON DISPATCH LOGS ===");
    console.log(JSON.stringify(logs, null, 2));

    const workspaces = await dbAll("SELECT id, domain, user_id, preferences FROM workspaces");
    console.log("=== WORKSPACES ===");
    console.log(JSON.stringify(workspaces, null, 2));

    const billing = await dbAll("SELECT * FROM billing_accounts");
    console.log("=== BILLING ===");
    console.log(JSON.stringify(billing, null, 2));
  });
});
