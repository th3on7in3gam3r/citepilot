import { NextResponse } from "next/server";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import { domainFormatStatus } from "@/lib/onboarding/domain-validation";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

const TIMEOUT_MS = 5000;

async function probe(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "CitePilot-Audit/1.0 (+https://getcitepilot.com)",
        Accept: "*/*",
      },
    });
    return res.ok || (res.status >= 300 && res.status < 500);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export const GET = withApiLogging(async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("domain")?.trim();
  if (!raw) {
    return NextResponse.json({ error: "domain required" }, { status: 400 });
  }

  const domain = normalizeDomain(raw);
  if (domainFormatStatus(domain) !== "valid") {
    return NextResponse.json({ reachable: false, domain }, { status: 400 });
  }

  let reachable = await probe(`https://${domain}`);
  if (!reachable) {
    reachable = await probe(`http://${domain}`);
  }

  return NextResponse.json({ reachable, domain });
});
