import { describe, expect, it } from "vitest";

import {
  AI_CONTENT_LIMIT,
  buildAutoTagPrompt,
  normalizeSuggestedTags,
  parseTagResponse,
  truncateContent,
} from "./ai-tags";

describe("truncateContent", () => {
  it("keeps short content and cuts long content to the limit", () => {
    expect(truncateContent("abc")).toBe("abc");
    expect(truncateContent("x".repeat(AI_CONTENT_LIMIT + 50))).toHaveLength(AI_CONTENT_LIMIT);
  });
});

describe("buildAutoTagPrompt", () => {
  it("includes the type, title, existing tags and truncated content", () => {
    const prompt = buildAutoTagPrompt({
      type: "snippet",
      title: "useAuth hook",
      content: "y".repeat(AI_CONTENT_LIMIT + 100),
      existingTags: ["react"],
    });

    expect(prompt).toContain("Type: snippet");
    expect(prompt).toContain("Title: useAuth hook");
    expect(prompt).toContain("Existing tags: react");
    expect(prompt).toContain("y".repeat(AI_CONTENT_LIMIT));
    expect(prompt).not.toContain("y".repeat(AI_CONTENT_LIMIT + 1));
  });

  it("leaves out empty content and tags", () => {
    const prompt = buildAutoTagPrompt({ type: "link", title: "Docs", content: "   " });
    expect(prompt).toBe("Type: link\nTitle: Docs\nReturn the tags as JSON.");
  });

  it("mentions JSON in the input, which JSON mode requires", () => {
    expect(buildAutoTagPrompt({ type: "note", title: "x" }).toLowerCase()).toContain("json");
  });
});

describe("parseTagResponse", () => {
  it("reads an object with a tags array", () => {
    expect(parseTagResponse('{"tags": ["react", "hooks"]}')).toEqual(["react", "hooks"]);
  });

  it("reads a bare array", () => {
    expect(parseTagResponse('["git", "cli"]')).toEqual(["git", "cli"]);
  });

  it("drops non-string entries", () => {
    expect(parseTagResponse('{"tags": ["ok", 3, null]}')).toEqual(["ok"]);
  });

  it("returns nothing for invalid JSON or other shapes", () => {
    expect(parseTagResponse("")).toEqual([]);
    expect(parseTagResponse("not json")).toEqual([]);
    expect(parseTagResponse('{"labels": ["a"]}')).toEqual([]);
    expect(parseTagResponse('{"tags": "a"}')).toEqual([]);
  });
});

describe("normalizeSuggestedTags", () => {
  it("lowercases, trims, hyphenates spaces and strips a leading #", () => {
    expect(normalizeSuggestedTags([" React ", "#TypeScript", "Next JS"])).toEqual([
      "react",
      "typescript",
      "next-js",
    ]);
  });

  it("drops duplicates, blanks, overlong tags and existing tags", () => {
    expect(
      normalizeSuggestedTags(["react", "React", "", "x".repeat(31), "hooks"], ["REACT"]),
    ).toEqual(["hooks"]);
  });

  it("keeps at most 5 tags", () => {
    expect(normalizeSuggestedTags(["a", "b", "c", "d", "e", "f"])).toEqual(["a", "b", "c", "d", "e"]);
  });
});
