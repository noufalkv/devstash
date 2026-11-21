/**
 * The whole prompt is sent and may replace the saved content, so it is never truncated
 * like the other AI inputs; longer prompts are rejected instead.
 */
export const OPTIMIZE_CONTENT_LIMIT = 8000;

export const OPTIMIZE_INSTRUCTIONS = [
  "You review and improve AI prompts saved in a developer knowledge hub.",
  "Refine the prompt only where it helps: clarity, structure, specificity, missing context, constraints and the expected output format.",
  "Keep the author's intent, voice and language. Keep every placeholder or variable exactly as written, such as {{name}}, {name}, <input> or $VAR, and keep Markdown formatting.",
  "Do not add new requirements the author did not imply, and do not answer the prompt.",
  "If the prompt is already clear and effective, return it unchanged and set unchanged to true.",
  'Reply with a JSON object: {"optimized": "<the full improved prompt>", "changes": "<one or two sentences on what you changed, or why no change was needed>", "unchanged": <true or false>}.',
  "JSON is only the format of your reply. Never add JSON or any other output format to the prompt itself unless the original prompt already asks for it.",
].join(" ");

export interface OptimizeInput {
  title: string;
  content: string;
}

export interface PromptOptimization {
  optimized: string;
  changes: string;
  unchanged: boolean;
}

export function buildOptimizePrompt({ title, content }: OptimizeInput): string {
  return [
    `Title: ${title}`,
    "Prompt:",
    '"""',
    content.trim(),
    '"""',
    // JSON mode requires the word "json" in the input itself. Worded as the reply envelope so
    // the model does not read it as a requirement to add to the prompt.
    "Reply with the JSON object from your instructions; do not add a JSON requirement to the prompt.",
  ].join("\n");
}

const MAX_CHANGES_LENGTH = 500;

/** Reads the model's JSON reply; null when it is not usable. An identical prompt counts as unchanged. */
export function parseOptimizeResponse(
  text: string | null | undefined,
  original: string,
): PromptOptimization | null {
  let data: unknown;
  try {
    data = JSON.parse(text ?? "");
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;

  const { optimized, changes, unchanged } = data as Record<string, unknown>;
  if (typeof optimized !== "string" || !optimized.trim()) return null;

  const trimmed = optimized.trim();
  const isUnchanged = unchanged === true || trimmed === original.trim();
  const summary = typeof changes === "string" ? changes.trim().slice(0, MAX_CHANGES_LENGTH) : "";

  return {
    optimized: isUnchanged ? original : trimmed,
    changes: summary || (isUnchanged ? "This prompt is already clear and effective." : ""),
    unchanged: isUnchanged,
  };
}
