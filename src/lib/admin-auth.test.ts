import { describe, expect, it } from "vitest";
import {
  checkAdminAccess,
  isAdminApiPublic,
  isAdminProtectedPath,
} from "@/lib/admin-auth";

describe("admin auth", () => {
  const secret = "test-admin-secret";

  it("marks admin routes as protected when secret is configured", () => {
    expect(isAdminProtectedPath("/admin")).toBe(true);
    expect(isAdminProtectedPath("/api/admin/stats")).toBe(true);
    expect(isAdminProtectedPath("/admin/login")).toBe(false);
    expect(isAdminApiPublic("/api/admin/login")).toBe(true);
    expect(isAdminProtectedPath("/dashboard")).toBe(false);
  });

  it("allows dev mode when ADMIN_SECRET is unset", () => {
    expect(checkAdminAccess("/admin", undefined, undefined)).toEqual({
      allowed: true,
      protected: false,
    });
  });

  it("rejects protected routes without a matching cookie", () => {
    expect(checkAdminAccess("/admin", undefined, secret)).toEqual({
      allowed: false,
      protected: true,
    });
    expect(checkAdminAccess("/api/admin/stats", "wrong", secret)).toEqual({
      allowed: false,
      protected: true,
    });
  });

  it("allows protected routes with a matching cookie", () => {
    expect(checkAdminAccess("/admin", secret, secret)).toEqual({
      allowed: true,
      protected: true,
    });
  });
});
