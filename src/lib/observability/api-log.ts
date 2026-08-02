import { after, NextResponse } from "next/server";

export type ApiLogRecord = {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  userId?: string | null;
};

const SKIP_PREFIXES = ["/_next/", "/favicon.ico"];
const SKIP_EXACT = new Set(["/api/health"]);

export function shouldSkipApiLog(pathname: string): boolean {
  if (SKIP_EXACT.has(pathname)) return true;
  return SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function logApiRequest(record: ApiLogRecord): void {
  console.log(
    JSON.stringify({
      level: "info",
      type: "api_request",
      method: record.method,
      path: record.path,
      status: record.status,
      durationMs: record.durationMs,
      userId: record.userId ?? null,
      ts: new Date().toISOString(),
    }),
  );
}

type RouteHandler = (
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- App Router context shapes vary by segment
  context?: any,
) => Promise<Response> | Response;

async function resolveUserId(request: Request): Promise<string | null> {
  try {
    const { optionalApiUser } = await import("@/lib/auth/api");
    const user = await optionalApiUser(request);
    return user.userId;
  } catch {
    return null;
  }
}

function scheduleAfter(fn: () => void | Promise<void>): void {
  try {
    after(fn);
  } catch {
    void fn();
  }
}

/** Wrap App Router route handlers for JSON request logs (Vercel-friendly). */
export function withApiLogging(handler: RouteHandler): RouteHandler {
  return async (request: Request, context?: unknown) => {
    const url = new URL(request.url);
    const path = url.pathname;

    if (shouldSkipApiLog(path)) {
      return handler(request, context);
    }

    const start = Date.now();
    const method = request.method;

    try {
      const response = await handler(request, context);
      const durationMs = Date.now() - start;

      scheduleAfter(async () => {
        const userId = await resolveUserId(request);
        logApiRequest({
          method,
          path,
          status: response.status,
          durationMs,
          userId,
        });
      });

      return response;
    } catch (error) {
      const durationMs = Date.now() - start;
      console.error(
        JSON.stringify({
          level: "error",
          type: "api_unhandled",
          method,
          path,
          durationMs,
          message: error instanceof Error ? error.message : "unknown",
          ts: new Date().toISOString(),
        }),
      );
      scheduleAfter(async () => {
        const userId = await resolveUserId(request);
        logApiRequest({
          method,
          path,
          status: 500,
          durationMs,
          userId,
        });
      });
      // Always return JSON — never rethrow empty 500s that break client .json().
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
