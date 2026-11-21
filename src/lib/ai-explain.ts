import { truncateContent } from "@/lib/ai-tags";
import { getCodeLanguageLabel, resolveCodeLanguage } from "@/lib/code-language";

export const EXPLAIN_INSTRUCTIONS = [
  "You explain code snippets and terminal commands saved in a developer knowledge hub.",
  "Write a concise explanation of about 200 to 300 words in Markdown.",
  "Start with one or two sentences on what the code does, then explain how it works and the key concepts, APIs or flags it uses.",
  "Use short paragraphs or a bullet list, and inline code for identifiers. Do not repeat the whole code back.",
  "Mention a notable pitfall or side effect only if there is one, such as a destructive command.",
].join(" ");

export interface ExplainInput {
  type: string;
  title: string;
  content: string;
  language?: string | null;
}

export function buildExplainPrompt({ type, title, content, language }: ExplainInput): string {
  const lines = [`Type: ${type}`, `Title: ${title}`];
  const monacoLanguage = resolveCodeLanguage(language);
  if (monacoLanguage !== "plaintext") lines.push(`Language: ${getCodeLanguageLabel(monacoLanguage)}`);
  lines.push("Code:", '"""', truncateContent(content.trim()), '"""');
  return lines.join("\n");
}

export function cleanExplanation(text: string | null | undefined): string | null {
  const cleaned = (text ?? "").trim();
  return cleaned || null;
}
