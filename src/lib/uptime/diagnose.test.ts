import { describe, expect, it } from "vitest";
import {
  diagnoseUptimeFailure,
  formatUptimeDiagnosis,
} from "@/lib/uptime/diagnose";

describe("diagnoseUptimeFailure", () => {
  it("returns null when up", () => {
    expect(
      diagnoseUptimeFailure({
        monitorType: "http",
        status: "up",
        statusCode: 200,
        message: "HTTP 200",
      }),
    ).toBeNull();
  });

  it("diagnoses HTTP 5xx", () => {
    const d = diagnoseUptimeFailure({
      monitorType: "http",
      status: "down",
      statusCode: 503,
      message: "HTTP 503 outside expected range 200–299",
    });
    expect(d?.cause).toMatch(/server error/i);
    expect(d?.fix).toMatch(/deploy|logs|Render/i);
  });

  it("diagnoses timeout from message", () => {
    const d = diagnoseUptimeFailure({
      monitorType: "http",
      status: "down",
      statusCode: null,
      message: "The operation was aborted due to timeout",
    });
    expect(d?.cause).toMatch(/unreachable|slow/i);
    expect(d?.fix).toMatch(/timeout|cold/i);
  });

  it("diagnoses DNS failures", () => {
    const d = diagnoseUptimeFailure({
      monitorType: "http",
      status: "down",
      statusCode: null,
      message: "getaddrinfo ENOTFOUND example.invalid",
      metadata: { errorCode: "ENOTFOUND" },
    });
    expect(d?.cause).toMatch(/DNS/i);
    expect(d?.fix).toMatch(/DNS/i);
  });

  it("diagnoses SSL expiry", () => {
    const d = diagnoseUptimeFailure({
      monitorType: "ssl",
      status: "down",
      statusCode: null,
      message: "Certificate expired 3 days ago",
      metadata: { daysLeft: -3 },
    });
    expect(d?.cause).toMatch(/expired/i);
    expect(d?.fix).toMatch(/Renew/i);
  });

  it("diagnoses keyword mismatch", () => {
    const d = diagnoseUptimeFailure({
      monitorType: "keyword",
      status: "down",
      statusCode: 200,
      message: 'Keyword "healthy" not found in response',
    });
    expect(d?.cause).toMatch(/keyword/i);
    expect(d?.fix).toMatch(/keyword|response/i);
  });

  it("diagnoses cron staleness", () => {
    const d = diagnoseUptimeFailure({
      monitorType: "cron",
      status: "down",
      statusCode: 200,
      message: "No successful cron run in the last 600s",
    });
    expect(d?.cause).toMatch(/job|scheduled/i);
    expect(d?.fix).toMatch(/cron|schedule/i);
  });

  it("formats diagnosis for alerts", () => {
    const d = diagnoseUptimeFailure({
      monitorType: "http",
      status: "down",
      statusCode: 500,
      message: "HTTP 500",
    });
    expect(d).not.toBeNull();
    expect(formatUptimeDiagnosis(d!)).toMatch(/^Likely: .+ Try: .+/);
  });
});
