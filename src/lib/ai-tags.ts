export const AI_CONTENT_LIMIT = 2000;
export const MAX_SUGGESTED_TAGS = 5;
const MAX_TAG_LENGTH = 30;

export const AUTO_TAG_INSTRUCTIONS = [
  "You suggest tags for items in a developer knowledge hub (snippets, prompts, commands, notes, links, files).",
  "Suggest 3 to 5 short, lowercase tags that describe the item's language, framework, tool or topic.",
  "Use single words or hyphenated phrases. Do not repeat the existing tags.",
  'Respond only with JSON in the form {"tags": ["tag-one", "tag-two"]}.',
].join(" ");

export interface AutoTagInput {
  type: string;
  title: string;
  content?: string | null;
  existingTags?: string[];
}

export function truncateContent(content: string, limit = AI_CONTENT_LIMIT): string {
  return content.length > limit ? content.slice(0, limit) : content;
}

export function buildAutoTagPrompt({ type, title, content, existingTags = [] }: AutoTagInput): string {
  const lines = [`Type: ${type}`, `Title: ${title}`];
  if (existingTags.length > 0) lines.push(`Existing tags: ${existingTags.join(", ")}`);
  const body = content?.trim();
  if (body) lines.push("Content:", '"""', truncateContent(body), '"""');
  // JSON mode requires the word "json" in the input itself, not only in the instructions
  lines.push("Return the tags as JSON.");
  return lines.join("\n");
}

// The model may return {"tags": [...]} or a bare [...]; anything else yields no tags.
export function parseTagResponse(text: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  const list =
    Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && "tags" in parsed
        ? (parsed as { tags: unknown }).tags
        : null;
  if (!Array.isArray(list)) return [];
  return list.filter((tag): tag is string => typeof tag === "string");
}

export function normalizeSuggestedTags(tags: string[], existingTags: string[] = []): string[] {
  const existing = new Set(existingTags.map((tag) => tag.trim().toLowerCase()));
  const result: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
    if (!tag || tag.length > MAX_TAG_LENGTH || existing.has(tag) || result.includes(tag)) continue;
    result.push(tag);
    if (result.length === MAX_SUGGESTED_TAGS) break;
  }
  return result;
}
