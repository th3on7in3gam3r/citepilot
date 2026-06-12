import { afterEach, describe, expect, it } from "vitest";
import {
  googleSearchConfigured,
  googleSearchContextText,
  serpApiConfigured,
  serperConfigured,
  type GoogleSearchResponse,
} from "@/lib/search/google";

describe("google search config", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("detects SerpAPI when only SERPAPI_API_KEY is set", () => {
    delete process.env.SERPER_API_KEY;
    process.env.SERPAPI_API_KEY = "test-key";
    expect(serpApiConfigured()).toBe(true);
    expect(serperConfigured()).toBe(false);
    expect(googleSearchConfigured()).toBe(true);
  });
});

describe("googleSearchContextText", () => {
  it("includes AI overview, answer box, and organic snippets", () => {
    const result: GoogleSearchResponse = {
      provider: "serpapi",
      organic: [
        { title: "Acme", link: "https://acme.com", snippet: "Best tool" },
      ],
      answerBoxSnippet: "Quick answer",
      aiOverviewText: "AI summary line",
    };
    const text = googleSearchContextText(result);
    expect(text).toContain("AI summary line");
    expect(text).toContain("Quick answer");
    expect(text).toContain("https://acme.com");
  });
});
