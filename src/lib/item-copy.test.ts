import { describe, expect, it } from "vitest";

import { getCopyText } from "@/lib/item-copy";

describe("getCopyText", () => {
  it("returns the content for text items", () => {
    expect(
      getCopyText({ contentType: "TEXT", content: "ls -la", url: null }),
    ).toBe("ls -la");
  });

  it("returns the URL for link items", () => {
    expect(
      getCopyText({
        contentType: "URL",
        content: "ignored",
        url: "https://example.com",
      }),
    ).toBe("https://example.com");
  });

  it("returns null for file items", () => {
    expect(
      getCopyText({ contentType: "FILE", content: "x", url: "y" }),
    ).toBeNull();
  });

  it("returns null when there is nothing to copy", () => {
    expect(
      getCopyText({ contentType: "TEXT", content: null, url: null }),
    ).toBeNull();
    expect(
      getCopyText({ contentType: "TEXT", content: "   ", url: null }),
    ).toBeNull();
    expect(getCopyText({ contentType: "URL", content: null, url: null })).toBeNull();
  });
});
