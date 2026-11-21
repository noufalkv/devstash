import { describe, expect, it } from "vitest";

import { buildOptimizePrompt, OPTIMIZE_INSTRUCTIONS, parseOptimizeResponse } from "./ai-optimize";

describe("buildOptimizePrompt", () => {
  it("sends the title and the whole trimmed prompt and asks for JSON", () => {
    const content = `  ${"word ".repeat(1000)}{{code}}  `;
    const prompt = buildOptimizePrompt({ title: "Review", content });

    expect(prompt).toContain("Title: Review");
    expect(prompt).toContain(content.trim());
    expect(prompt).toMatch(/json/i);
  });

  it("tells the model to keep placeholders", () => {
    expect(OPTIMIZE_INSTRUCTIONS).toContain("{{name}}");
  });
});

describe("parseOptimizeResponse", () => {
  const original = "review my code";

  it("returns the trimmed optimized prompt and the change summary", () => {
    expect(
      parseOptimizeResponse(
        JSON.stringify({ optimized: "  Review the code.  ", changes: " Clarified the task. ", unchanged: false }),
        original,
      ),
    ).toEqual({ optimized: "Review the code.", changes: "Clarified the task.", unchanged: false });
  });

  it("keeps the original text when the model marks it unchanged", () => {
    expect(
      parseOptimizeResponse(
        JSON.stringify({ optimized: "Review my code!", changes: "Already clear.", unchanged: true }),
        original,
      ),
    ).toEqual({ optimized: original, changes: "Already clear.", unchanged: true });
  });

  it("treats an identical prompt as unchanged with a default note", () => {
    expect(
      parseOptimizeResponse(JSON.stringify({ optimized: ` ${original} ` }), original),
    ).toEqual({
      optimized: original,
      changes: "This prompt is already clear and effective.",
      unchanged: true,
    });
  });

  it("caps a long change summary", () => {
    const result = parseOptimizeResponse(
      JSON.stringify({ optimized: "New", changes: "x".repeat(900) }),
      original,
    );
    expect(result?.changes).toHaveLength(500);
  });

  it.each([null, "", "not json", "[]", '"text"', '{"optimized": ""}', '{"optimized": 3}', '{"changes": "x"}'])(
    "returns null for an unusable reply %j",
    (text) => {
      expect(parseOptimizeResponse(text, original)).toBeNull();
    },
  );
});
