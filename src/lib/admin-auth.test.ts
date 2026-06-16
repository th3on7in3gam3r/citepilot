import { describe, expect, it } from "vitest";
import { adminEmailsFromEnv, isAdminEmail, isAdminProtectedPath } from "@/lib/admin/emails";
import { checkAdminAccess, checkAdminEmailAccess } from "@/lib/admin-auth";

describe("admin auth", () => {
  it("marks admin routes as protected", () => {
    expect(isAdminProtectedPath("/admin")).toBe(true);
    expect(isAdminProtectedPath("/api/admin/stats")).toBe(true);
    expect(isAdminProtectedPath("/dashboard")).toBe(false);
  });

  it("matches admin emails case-insensitively", () => {
    process.env.ADMIN_EMAILS = "Admin@Example.com, ops@test.io";
    expect(isAdminEmail("admin@example.com")).toBe(true);
    expect(isAdminEmail("ops@test.io")).toBe(true);
    expect(isAdminEmail("other@test.io")).toBe(false);
    delete process.env.ADMIN_EMAILS;
  });

  it("rejects protected routes when ADMIN_EMAILS is unset", () => {
    delete process.env.ADMIN_EMAILS;
    expect(checkAdminAccess("/admin", undefined, undefined)).toEqual({
      allowed: false,
      protected: true,
    });
  });

  it("checkAdminEmailAccess allows listed emails", async () => {
    process.env.ADMIN_EMAILS = "admin@test.io";
    await expect(checkAdminEmailAccess("/admin", "admin@test.io")).resolves.toEqual({
      allowed: true,
      protected: true,
    });
    await expect(checkAdminEmailAccess("/admin", "other@test.io")).resolves.toEqual({
      allowed: false,
      protected: true,
    });
    delete process.env.ADMIN_EMAILS;
  });

  it("adminEmailsFromEnv parses comma list", () => {
    process.env.ADMIN_EMAILS = " a@b.com , c@d.com ";
    expect(adminEmailsFromEnv()).toEqual(["a@b.com", "c@d.com"]);
    delete process.env.ADMIN_EMAILS;
  });
});
