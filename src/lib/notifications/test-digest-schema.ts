export type TestDigestType = "weekly_digest" | "drop_alert";

export type TestDigestRequest = {
  type: TestDigestType;
  workspaceId: string;
};

type FieldErrors = Record<string, string[]>;

function flattenFieldErrors(errors: FieldErrors) {
  return {
    fieldErrors: errors,
    formErrors: [] as string[],
  };
}

const VALID_TYPES: TestDigestType[] = ["weekly_digest", "drop_alert"];

export function formatValidationErrorMessage(
  details: ReturnType<typeof flattenFieldErrors>,
): string {
  const fieldMsgs = Object.entries(details.fieldErrors).flatMap(([field, msgs]) =>
    msgs.map((m) => (field === "_form" ? m : `${field}: ${m}`)),
  );
  if (fieldMsgs.length > 0) return fieldMsgs.join(" ");
  return details.formErrors.join(" ") || "Validation failed";
}

export function parseTestDigestRequest(
  body: unknown,
):
  | { success: true; data: TestDigestRequest }
  | {
      success: false;
      error: { flatten: () => ReturnType<typeof flattenFieldErrors> };
    } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return {
      success: false,
      error: {
        flatten: () =>
          flattenFieldErrors({
            _form: ["Request body must be a JSON object"],
          }),
      },
    };
  }

  const raw = body as Record<string, unknown>;
  const errors: FieldErrors = {};

  const workspaceId =
    typeof raw.workspaceId === "string"
      ? raw.workspaceId.trim()
      : raw.workspaceId != null
        ? String(raw.workspaceId).trim()
        : "";

  if (!workspaceId) {
    errors.workspaceId = ["workspaceId is required"];
  }

  const typeRaw =
    typeof raw.type === "string"
      ? raw.type.trim()
      : raw.type != null
        ? String(raw.type).trim()
        : "";

  if (!typeRaw) {
    errors.type = ['type is required — use "weekly_digest" or "drop_alert"'];
  } else if (!VALID_TYPES.includes(typeRaw as TestDigestType)) {
    errors.type = [
      `type must be one of: ${VALID_TYPES.map((t) => `"${t}"`).join(", ")}`,
    ];
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      error: { flatten: () => flattenFieldErrors(errors) },
    };
  }

  return {
    success: true,
    data: {
      type: typeRaw as TestDigestType,
      workspaceId,
    },
  };
}
