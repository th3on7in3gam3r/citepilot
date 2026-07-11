import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  emitStudioOpsEventAsync,
  isStudioOpsConfigured,
  STUDIO_OPS_PRODUCT,
} from "@/lib/studio-ops";

describe("studio-ops", () => {
  beforeEach(() => {
    vi.stubEnv("STUDIO_OPS_URL", "");
    vi.stubEnv("STUDIO_OPS_WEBHOOK_SECRET", "");
    vi.stubEnv("STUDIO_OPS_SECRET", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("isStudioOpsConfigured is false without env", () => {
    expect(isStudioOpsConfigured()).toBe(false);
  });

  it("no-ops when URL is unset", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await emitStudioOpsEventAsync("user.signup", { userId: "u1" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts signed ingest payload when configured", async () => {
    vi.stubEnv("STUDIO_OPS_URL", "https://ops.example.com");
    vi.stubEnv("STUDIO_OPS_WEBHOOK_SECRET", "test-secret");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await emitStudioOpsEventAsync("workspace.created", {
      workspaceId: "ws-1",
      userId: "u1",
      domain: "acme.com",
      email: "founders@acme.com",
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("https://ops.example.com/api/events");
    expect(init?.method).toBe("POST");

    const body = JSON.parse(String(init?.body)) as {
      product: string;
      event: string;
      email: string | null;
      externalUserId: string | null;
      metadata: { workspaceId: string; domain: string };
    };
    expect(body.product).toBe(STUDIO_OPS_PRODUCT);
    expect(body.event).toBe("workspace.created");
    expect(body.email).toBe("founders@acme.com");
    expect(body.externalUserId).toBe("u1");
    expect(body.metadata.workspaceId).toBe("ws-1");
    expect(body.metadata.domain).toBe("acme.com");

    const headers = init?.headers as Record<string, string>;
    expect(headers["X-Studio-Ops-Signature"]).toMatch(/^[a-f0-9]{64}$/);
  });
});
