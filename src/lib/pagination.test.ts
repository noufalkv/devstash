import { describe, expect, it } from "vitest";

import {
  getPageCount,
  getPageHref,
  getPageLinks,
  parsePage,
  toSkipTake,
} from "@/lib/pagination";

describe("parsePage", () => {
  it("parses a positive integer", () => {
    expect(parsePage("3")).toBe(3);
  });

  it("uses the first value when the param repeats", () => {
    expect(parsePage(["4", "2"])).toBe(4);
  });

  it.each([undefined, "", "0", "-1", "abc", "2.5", "1e3", " 2"])(
    "falls back to page 1 for %j",
    (raw) => {
      expect(parsePage(raw)).toBe(1);
    },
  );

  it("falls back to page 1 for numbers too large to be safe", () => {
    expect(parsePage("99999999999999999999")).toBe(1);
  });
});

describe("getPageCount", () => {
  it("rounds up partial pages", () => {
    expect(getPageCount(22, 21)).toBe(2);
    expect(getPageCount(21, 21)).toBe(1);
  });

  it("returns 1 for an empty list", () => {
    expect(getPageCount(0, 21)).toBe(1);
  });
});

describe("toSkipTake", () => {
  it("offsets by the previous pages", () => {
    expect(toSkipTake({ page: 1, perPage: 21 })).toEqual({ skip: 0, take: 21 });
    expect(toSkipTake({ page: 3, perPage: 21 })).toEqual({ skip: 42, take: 21 });
  });
});

describe("getPageLinks", () => {
  it("lists every page when there are few", () => {
    expect(getPageLinks(1, 1)).toEqual([1]);
    expect(getPageLinks(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("collapses gaps on both sides of the current page", () => {
    expect(getPageLinks(6, 12)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 12]);
  });

  it("collapses only the far side near the start or end", () => {
    expect(getPageLinks(1, 12)).toEqual([1, 2, "ellipsis", 12]);
    expect(getPageLinks(12, 12)).toEqual([1, "ellipsis", 11, 12]);
  });

  it("shows a single skipped page instead of an ellipsis", () => {
    expect(getPageLinks(4, 12)).toEqual([1, 2, 3, 4, 5, "ellipsis", 12]);
  });
});

describe("getPageHref", () => {
  it("omits the param for page 1", () => {
    expect(getPageHref("/items/snippets", 1)).toBe("/items/snippets");
  });

  it("adds the page param otherwise", () => {
    expect(getPageHref("/items/snippets", 3)).toBe("/items/snippets?page=3");
  });
});
