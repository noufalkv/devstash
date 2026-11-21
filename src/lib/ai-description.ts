import { truncateContent } from "@/lib/ai-tags";

export const MAX_DESCRIPTION_LENGTH = 300;

export const DESCRIPTION_INSTRUCTIONS = [
  "You write descriptions for items in a developer knowledge hub (snippets, prompts, commands, notes, links, files, images).",
  "Summarize what the item is and what it is for in 1 to 2 concise sentences, under 40 words.",
  "Use plain text only: no markdown, no quotes, no lists, and do not start with phrases like 'This item'.",
  "If there is little information, describe it as best you can from the title.",
].join(" ");

export interface DescriptionInput {
  type: string;
  title: string;
  content?: string | null;
  language?: string | null;
  tags?: string[];
}

export function buildDescriptionPrompt({
  type,
  title,
  content,
  language,
  tags = [],
}: DescriptionInput): string {
  const lines = [`Type: ${type}`, `Title: ${title}`];
  const lang = language?.trim();
  if (lang && lang !== "plaintext") lines.push(`Language: ${lang}`);
  if (tags.length > 0) lines.push(`Tags: ${tags.join(", ")}`);
  const body = content?.trim();
  if (body) lines.push("Content:", '"""', truncateContent(body), '"""');
  return lines.join("\n");
}

const QUOTE_PAIRS: Record<string, string> = { '"': '"', "'": "'", "“": "”", "‘": "’" };

// Removes one pair of quotes around the whole reply, but not a quote or backtick that only
// starts or ends it (e.g. "`cn` merges class names").
function stripWrappingQuotes(text: string): string {
  const close = QUOTE_PAIRS[text[0]];
  return close && text.length >= 2 && text.endsWith(close) ? text.slice(1, -1).trim() : text;
}

// Collapses the reply to one line, strips wrapping quotes and caps the length at a word boundary.
export function cleanDescription(text: string | null | undefined): string | null {
  const cleaned = stripWrappingQuotes((text ?? "").replace(/\s+/g, " ").trim());
  if (!cleaned) return null;
  if (cleaned.length <= MAX_DESCRIPTION_LENGTH) return cleaned;
  const cut = cleaned.slice(0, MAX_DESCRIPTION_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, "")}…`;
}
