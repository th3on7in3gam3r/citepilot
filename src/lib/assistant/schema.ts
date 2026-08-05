import { z } from "zod";

export const assistantChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

export const assistantChatBodySchema = z.object({
  messages: z.array(assistantChatMessageSchema).min(1).max(20),
  locale: z.string().trim().max(16).optional(),
});

export const assistantLeadBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  intent: z.string().trim().min(1).max(500),
  transcript: z.string().trim().max(8000).optional().or(z.literal("")),
  locale: z.string().trim().max(16).optional(),
});

export type AssistantChatBody = z.infer<typeof assistantChatBodySchema>;
export type AssistantLeadBody = z.infer<typeof assistantLeadBodySchema>;
