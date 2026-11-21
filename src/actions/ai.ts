"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  AUTO_TAG_INSTRUCTIONS,
  buildAutoTagPrompt,
  normalizeSuggestedTags,
  parseTagResponse,
} from "@/lib/ai-tags";
import { AI_MODEL, getOpenAI, isAiConfigured } from "@/lib/openai";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { canUseProFeature } from "@/lib/usage-limits";

export interface AiActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  upgrade?: boolean;
  rateLimited?: boolean;
}

const AI_ERROR = "AI tag suggestions are unavailable right now. Please try again.";

// Content is truncated to 2000 characters before the API call; this cap only rejects absurd payloads.
const autoTagSchema = z.object({
  type: z.string().trim().min(1).max(30),
  title: z.string().trim().min(1, "Add a title first").max(300),
  content: z.string().max(100_000).nullish(),
  existingTags: z.array(z.string().max(100)).max(50).default([]),
});

export async function generateAutoTags(
  input: unknown,
): Promise<AiActionResult<{ tags: string[] }>> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "You must be signed in" };
  if (!canUseProFeature(session.user.isPro)) {
    return { success: false, error: "AI tag suggestions are a Pro feature", upgrade: true };
  }
  if (!isAiConfigured()) return { success: false, error: AI_ERROR };

  // Validate before the rate limit so invalid input does not use up quota
  const parsed = autoTagSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { success, reset } = await checkRateLimit("ai", userId);
  if (!success) return { success: false, error: rateLimitMessage(reset), rateLimited: true };

  try {
    const response = await getOpenAI().responses.create({
      model: AI_MODEL,
      instructions: AUTO_TAG_INSTRUCTIONS,
      input: buildAutoTagPrompt(parsed.data),
      reasoning: { effort: "low" },
      text: { format: { type: "json_object" } },
      store: false,
    });

    const tags = normalizeSuggestedTags(
      parseTagResponse(response.output_text),
      parsed.data.existingTags,
    );
    if (tags.length === 0) return { success: false, error: "No tag suggestions found" };
    return { success: true, data: { tags } };
  } catch (error) {
    console.error("generateAutoTags failed:", error);
    return { success: false, error: AI_ERROR };
  }
}
