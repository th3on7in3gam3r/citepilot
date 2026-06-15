import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FLEET_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "PROMPT_LIMIT_EXCEEDED"
  | "RATE_LIMIT"
  | "AUDIT_LIMIT"
  | "KEY_LIMIT"
  | "WORKSPACE_SCOPE"
  | "INTERNAL_ERROR";

export function apiErrorResponse(
  error: string,
  code: ApiErrorCode,
  status: number,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    {
      error,
      code,
      status,
      ...extra,
    },
    { status },
  );
}
