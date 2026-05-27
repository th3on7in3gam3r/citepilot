import { describe, expect, it } from "vitest";
import {
  defaultAutopilotPreferences,
  mergePreferences,
  parsePreferences,
} from "@/lib/settings";

describe("autopilot preferences", () => {
  it("defaults autopilot to off", () => {
    const prefs = parsePreferences("{}");
    expect(prefs.autopilot).toEqual(defaultAutopilotPreferences);
  });

  it("merges autopilot patch", () => {
    const base = parsePreferences("{}");
    const merged = mergePreferences(base, {
      autopilot: { enabled: true },
    });
    expect(merged.autopilot.enabled).toBe(true);
    expect(merged.autopilot.emailReport).toBe(true);
  });
});
