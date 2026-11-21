"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  buildDescriptionPrompt,
  cleanDescription,
  DESCRIPTION_INSTRUCTIONS,
} from "@/lib/ai-description";
import { buildExplainPrompt, cleanExplanation, EXPLAIN_INSTRUCTIONS } from "@/lib/ai-explain";
import {
  AUTO_TAG_INSTRUCTIONS,
  buildAutoTagPrompt,
  normalizeSuggestedTags,
  parseTagResponse,
} from "@/lib/ai-tags";
import { getItemDetail } from "@/lib/db/items";
import { CODE_EDITOR_TYPES } from "@/lib/item-fields";
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

const AI_ERROR = "AI suggestions are unavailable right now. Please try again.";

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

const descriptionSchema = z.object({
  type: z.string().trim().min(1).max(30),
  title: z.string().trim().min(1, "Add a title first").max(300),
  content: z.string().max(100_000).nullish(),
  language: z.string().max(50).nullish(),
  tags: z
    .array(z.string().max(100))
    .max(50)
    .default([])
    .transform((tags) => tags.map((tag) => tag.trim()).filter(Boolean)),
});

export async function generateDescription(
  input: unknown,
): Promise<AiActionResult<{ description: string }>> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "You must be signed in" };
  if (!canUseProFeature(session.user.isPro)) {
    return { success: false, error: "AI descriptions are a Pro feature", upgrade: true };
  }
  if (!isAiConfigured()) return { success: false, error: AI_ERROR };

  // Validate before the rate limit so invalid input does not use up quota
  const parsed = descriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { success, reset } = await checkRateLimit("ai", userId);
  if (!success) return { success: false, error: rateLimitMessage(reset), rateLimited: true };

  try {
    const response = await getOpenAI().responses.create({
      model: AI_MODEL,
      instructions: DESCRIPTION_INSTRUCTIONS,
      input: buildDescriptionPrompt(parsed.data),
      reasoning: { effort: "low" },
      store: false,
    });

    const description = cleanDescription(response.output_text);
    if (!description) return { success: false, error: "Could not generate a description" };
    return { success: true, data: { description } };
  } catch (error) {
    console.error("generateDescription failed:", error);
    return { success: false, error: AI_ERROR };
  }
}

const explainSchema = z.object({ itemId: z.string().trim().min(1, "Invalid item").max(100) });

// Loads the code by owned item id, so the action only explains the user's own snippets and
// commands and cannot be used as a general-purpose proxy to the model.
export async function explainCode(
  input: unknown,
): Promise<AiActionResult<{ explanation: string }>> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "You must be signed in" };
  if (!canUseProFeature(session.user.isPro)) {
    return { success: false, error: "AI code explanations are a Pro feature", upgrade: true };
  }
  if (!isAiConfigured()) return { success: false, error: AI_ERROR };

  const parsed = explainSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Checked before the rate limit so a bad id does not use up quota
  const item = await getItemDetail(parsed.data.itemId, userId);
  if (!item || !CODE_EDITOR_TYPES.has(item.itemType.name)) {
    return { success: false, error: "Item not found" };
  }
  if (!item.content?.trim()) return { success: false, error: "There is no code to explain" };

  const { success, reset } = await checkRateLimit("ai", userId);
  if (!success) return { success: false, error: rateLimitMessage(reset), rateLimited: true };

  try {
    const response = await getOpenAI().responses.create({
      model: AI_MODEL,
      instructions: EXPLAIN_INSTRUCTIONS,
      input: buildExplainPrompt({
        type: item.itemType.name,
        title: item.title,
        content: item.content,
        language: item.language,
      }),
      reasoning: { effort: "low" },
      store: false,
    });

    const explanation = cleanExplanation(response.output_text);
    if (!explanation) return { success: false, error: "Could not explain this code" };
    return { success: true, data: { explanation } };
  } catch (error) {
    console.error("explainCode failed:", error);
    return { success: false, error: AI_ERROR };
  }
}
