import { isValidRecipientEmail } from "@/lib/email/send";

export type TestDigestRequest = {
  workspaceId: string;
  email?: string;
};

type FieldErrors = Record<string, string[]>;

function flattenFieldErrors(errors: FieldErrors) {
  return {
    fieldErrors: errors,
    formErrors: [] as string[],
  };
}

export function parseTestDigestRequest(
  body: unknown,
): { success: true; data: TestDigestRequest } | { success: false; error: { flatten: () => ReturnType<typeof flattenFieldErrors> } } {
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

  let email: string | undefined;
  if (raw.email !== undefined && raw.email !== null) {
    if (typeof raw.email !== "string") {
      errors.email = ["email must be a string"];
    } else {
      email = raw.email.trim();
      if (!email) {
        errors.email = ["email cannot be empty when provided"];
      } else if (!isValidRecipientEmail(email)) {
        errors.email = [`Invalid email address: ${email}`];
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      error: { flatten: () => flattenFieldErrors(errors) },
    };
  }

  return {
    success: true,
    data: { workspaceId, email },
  };
}
