import { describe, expect, it } from "vitest";

import { AI_CONTENT_LIMIT } from "@/lib/ai-tags";

import { buildExplainPrompt, cleanExplanation } from "./ai-explain";

describe("buildExplainPrompt", () => {
  it("includes the type, title, language label and code", () => {
    expect(
      buildExplainPrompt({
        type: "command",
        title: "Undo last commit",
        content: "  git reset --hard HEAD~1\n",
        language: "bash",
      }),
    ).toBe('Type: command\nTitle: Undo last commit\nLanguage: Shell\nCode:\n"""\ngit reset --hard HEAD~1\n"""');
  });

  it("leaves out plain text and unknown languages", () => {
    expect(buildExplainPrompt({ type: "snippet", title: "T", content: "x", language: null })).not.toContain(
      "Language:",
    );
    expect(buildExplainPrompt({ type: "snippet", title: "T", content: "x", language: "sfsdf" })).not.toContain(
      "Language:",
    );
  });

  it("truncates long code", () => {
    const prompt = buildExplainPrompt({ type: "snippet", title: "T", content: "a".repeat(AI_CONTENT_LIMIT + 50) });
    expect(prompt).toContain("a".repeat(AI_CONTENT_LIMIT));
    expect(prompt).not.toContain("a".repeat(AI_CONTENT_LIMIT + 1));
  });
});

describe("cleanExplanation", () => {
  it("trims the reply and keeps markdown line breaks", () => {
    expect(cleanExplanation("\n  # Title\n\n- one\n  ")).toBe("# Title\n\n- one");
  });

  it("returns null for an empty reply", () => {
    expect(cleanExplanation("   ")).toBeNull();
    expect(cleanExplanation(null)).toBeNull();
    expect(cleanExplanation(undefined)).toBeNull();
  });
});
