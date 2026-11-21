import { describe, expect, it } from "vitest";

import { isActivePath } from "@/lib/active-path";

describe("isActivePath", () => {
  it("matches the exact path", () => {
    expect(isActivePath("/items/snippets", "/items/snippets")).toBe(true);
    expect(isActivePath("/favorites", "/favorites")).toBe(true);
  });

  it("matches a sub-path", () => {
    expect(isActivePath("/items/snippets/abc", "/items/snippets")).toBe(true);
  });

  it("ignores a trailing slash", () => {
    expect(isActivePath("/favorites/", "/favorites")).toBe(true);
  });

  it("does not match a path that only shares a prefix", () => {
    expect(isActivePath("/items/snippets-old", "/items/snippets")).toBe(false);
    expect(isActivePath("/collections/abc", "/collections/ab")).toBe(false);
  });

  it("does not match other routes", () => {
    expect(isActivePath("/items/prompts", "/items/snippets")).toBe(false);
    expect(isActivePath("/dashboard", "/favorites")).toBe(false);
  });

  it("returns false without a pathname", () => {
    expect(isActivePath(null, "/favorites")).toBe(false);
  });
});
