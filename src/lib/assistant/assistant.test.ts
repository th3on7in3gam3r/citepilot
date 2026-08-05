import { describe, expect, it } from "vitest";
import { buildAssistantKnowledgePack } from "@/lib/assistant/knowledge";
import {
  retrieveFaqAnswer,
  stripSuggestLeadToken,
} from "@/lib/assistant/retrieve";
import {
  assistantChatBodySchema,
  assistantLeadBodySchema,
} from "@/lib/assistant/schema";

describe("assistant knowledge", () => {
  it("builds a non-empty FAQ pack", () => {
    const pack = buildAssistantKnowledgePack();
    expect(pack.length).toBeGreaterThan(5);
    expect(pack.some((i) => /price|plan|pilot/i.test(i.q + i.a))).toBe(true);
  });
});

describe("assistant retrieval soft-fail", () => {
  it("returns a pricing-related FAQ for pricing questions", () => {
    const pack = buildAssistantKnowledgePack();
    const result = retrieveFaqAnswer("What does Pilot cost?", pack);
    expect(result.reply.length).toBeGreaterThan(20);
    expect(result.suggestLead).toBe(true);
  });

  it("strips suggest-lead token", () => {
    const { reply, suggestLead } = stripSuggestLeadToken(
      "Happy to connect.\n[[SUGGEST_LEAD]]",
    );
    expect(reply).toBe("Happy to connect.");
    expect(suggestLead).toBe(true);
  });
});

describe("assistant schemas", () => {
  it("accepts valid chat body", () => {
    const parsed = assistantChatBodySchema.safeParse({
      messages: [{ role: "user", content: "How does monitoring work?" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty chat messages", () => {
    const parsed = assistantChatBodySchema.safeParse({ messages: [] });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid lead draft", () => {
    const parsed = assistantLeadBodySchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      company: "Acme",
      intent: "Want Pilot pricing details",
      transcript: "user: pricing?",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid lead email", () => {
    const parsed = assistantLeadBodySchema.safeParse({
      name: "Ada",
      email: "not-an-email",
      intent: "Hello",
    });
    expect(parsed.success).toBe(false);
  });
});
