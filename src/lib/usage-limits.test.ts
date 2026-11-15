import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  canUseProFeature,
  FREE_COLLECTION_LIMIT,
  FREE_ITEM_LIMIT,
  getCollectionLimitError,
  getItemLimitError,
  isProGatingEnabled,
  type UsageContext,
} from "@/lib/usage-limits";

const free: UsageContext = { isPro: false, itemCount: 0, collectionCount: 0 };
const pro: UsageContext = { isPro: true, itemCount: 0, collectionCount: 0 };

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("with gating off", () => {
  it.each(["", "false", "1", "TRUE"])("ignores ENFORCE_PRO_LIMITS=%j", (value) => {
    vi.stubEnv("ENFORCE_PRO_LIMITS", value);

    expect(isProGatingEnabled()).toBe(false);
    expect(getItemLimitError({ ...free, itemCount: 500 }, "snippet")).toBeNull();
    expect(getItemLimitError(free, "file")).toBeNull();
    expect(getItemLimitError(free, "image")).toBeNull();
    expect(getCollectionLimitError({ ...free, collectionCount: 50 })).toBeNull();
    expect(canUseProFeature(false)).toBe(true);
  });

  it("allows everything when the flag is unset", () => {
    vi.stubEnv("ENFORCE_PRO_LIMITS", undefined);

    expect(isProGatingEnabled()).toBe(false);
    expect(getItemLimitError({ ...free, itemCount: FREE_ITEM_LIMIT }, "note")).toBeNull();
    expect(canUseProFeature(false)).toBe(true);
  });
});

describe("with gating on", () => {
  beforeEach(() => {
    vi.stubEnv("ENFORCE_PRO_LIMITS", "true");
  });

  it("reports gating as enabled", () => {
    expect(isProGatingEnabled()).toBe(true);
  });

  it("never limits a Pro user", () => {
    const busy = { ...pro, itemCount: 10_000, collectionCount: 10_000 };

    expect(getItemLimitError(busy, "snippet")).toBeNull();
    expect(getItemLimitError(busy, "file")).toBeNull();
    expect(getItemLimitError(busy, "image")).toBeNull();
    expect(getCollectionLimitError(busy)).toBeNull();
    expect(canUseProFeature(true)).toBe(true);
  });

  it("allows a free user's 50th item and blocks the 51st", () => {
    expect(getItemLimitError({ ...free, itemCount: 49 }, "snippet")).toBeNull();

    const error = getItemLimitError({ ...free, itemCount: 50 }, "snippet");
    expect(error).toContain("50");
  });

  it("blocks file and image items for free users even at zero items", () => {
    expect(getItemLimitError(free, "file")).toMatch(/Pro feature/);
    expect(getItemLimitError(free, "image")).toMatch(/Pro feature/);
  });

  it.each(["snippet", "prompt", "command", "note", "link"])(
    "allows %s items for free users under the limit",
    (type) => {
      expect(getItemLimitError(free, type)).toBeNull();
    },
  );

  it("allows a free user's 3rd collection and blocks the 4th", () => {
    expect(getCollectionLimitError({ ...free, collectionCount: 2 })).toBeNull();

    const error = getCollectionLimitError({ ...free, collectionCount: 3 });
    expect(error).toContain(String(FREE_COLLECTION_LIMIT));
  });

  it("denies Pro features to free users", () => {
    expect(canUseProFeature(false)).toBe(false);
  });
});
