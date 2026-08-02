import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron/auth";
import { withApiLogging } from "@/lib/observability/api-log";
import { listActiveMoneyPrompts } from "@/lib/money-prompts/store";
import { runMoneyPromptCheck } from "@/lib/money-prompts/run-check";

export const runtime = "nodejs";
export const maxDuration = 300;

const BATCH_SIZE = 50;

export const GET = withApiLogging(async function GET(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const prompts = await listActiveMoneyPrompts(BATCH_SIZE);
  let checked = 0;
  let gapsOpened = 0;
  let errors = 0;

  for (const prompt of prompts) {
    try {
      const result = await runMoneyPromptCheck(prompt.id);
      if ("error" in result) {
        errors += 1;
        continue;
      }
      checked += 1;
      gapsOpened += result.gapsOpened;
    } catch {
      errors += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    checked,
    gapsOpened,
    errors,
    batchSize: prompts.length,
  });
});
