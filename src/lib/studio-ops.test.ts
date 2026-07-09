import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  emitStudioOpsEventAsync,
  isStudioOpsConfigured,
  STUDIO_OPS_PRODUCT,
} from "@/lib/studio-ops";

describe("studio-ops", () => {
  beforeEach(() => {
    vi.stubEnv("STUDIO_OPS_URL", "");
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

  it("posts signed event when configured", async () => {
    vi.stubEnv("STUDIO_OPS_URL", "https://ops.example.com/events");
    vi.stubEnv("STUDIO_OPS_SECRET", "test-secret");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await emitStudioOpsEventAsync("workspace.created", {
      workspaceId: "ws-1",
      userId: "u1",
      domain: "acme.com",
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("https://ops.example.com/events");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      "x-studio-ops-product": STUDIO_OPS_PRODUCT,
    });

    const body = JSON.parse(String(init?.body)) as {
      type: string;
      product: string;
      payload: { workspaceId: string };
    };
    expect(body.type).toBe("workspace.created");
    expect(body.product).toBe("citepilot");
    expect(body.payload.workspaceId).toBe("ws-1");
    expect(typeof init?.headers).toBe("object");
    const headers = init?.headers as Record<string, string>;
    expect(headers["x-studio-ops-signature"]).toMatch(/^[a-f0-9]{64}$/);
  });
});
