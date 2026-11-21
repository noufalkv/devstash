import { describe, expect, it } from "vitest";

import {
  buildDescriptionPrompt,
  cleanDescription,
  MAX_DESCRIPTION_LENGTH,
} from "./ai-description";
import { AI_CONTENT_LIMIT } from "./ai-tags";

describe("buildDescriptionPrompt", () => {
  it("includes the type, title, language, tags and truncated content", () => {
    const prompt = buildDescriptionPrompt({
      type: "snippet",
      title: "useAuth hook",
      content: "y".repeat(AI_CONTENT_LIMIT + 100),
      language: "typescript",
      tags: ["react", "auth"],
    });

    expect(prompt).toContain("Type: snippet");
    expect(prompt).toContain("Title: useAuth hook");
    expect(prompt).toContain("Language: typescript");
    expect(prompt).toContain("Tags: react, auth");
    expect(prompt).toContain("y".repeat(AI_CONTENT_LIMIT));
    expect(prompt).not.toContain("y".repeat(AI_CONTENT_LIMIT + 1));
  });

  it("leaves out empty content, tags and a plain-text language", () => {
    const prompt = buildDescriptionPrompt({
      type: "link",
      title: "Docs",
      content: "  ",
      language: "plaintext",
    });
    expect(prompt).toBe("Type: link\nTitle: Docs");
  });
});

describe("cleanDescription", () => {
  it("returns null for an empty reply", () => {
    expect(cleanDescription("")).toBeNull();
    expect(cleanDescription("  \n ")).toBeNull();
    expect(cleanDescription(undefined)).toBeNull();
    expect(cleanDescription('""')).toBeNull();
  });

  it("collapses whitespace and strips wrapping quotes", () => {
    expect(cleanDescription('  "A React hook\n that reads the session."  ')).toBe(
      "A React hook that reads the session.",
    );
    expect(cleanDescription("“Smart quotes.”")).toBe("Smart quotes.");
  });

  it("keeps quotes inside the text", () => {
    expect(cleanDescription('Runs "git reset" safely.')).toBe('Runs "git reset" safely.');
  });

  it("keeps a backtick or quote that only starts or ends the text", () => {
    expect(cleanDescription("`cn` merges Tailwind class names.")).toBe(
      "`cn` merges Tailwind class names.",
    );
    expect(cleanDescription("Resets the branch with 'git reset'")).toBe(
      "Resets the branch with 'git reset'",
    );
  });

  it("caps long replies at a word boundary with an ellipsis", () => {
    const result = cleanDescription("word ".repeat(100));
    expect(result).not.toBeNull();
    expect(result!.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH + 1);
    expect(result!.endsWith("word…")).toBe(true);
  });
});
