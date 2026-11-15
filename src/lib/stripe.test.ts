import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { StripeMock } = vi.hoisted(() => ({
  StripeMock: vi.fn(function (this: { key: string }, key: string) {
    this.key = key;
  }),
}));

vi.mock("stripe", () => ({ default: StripeMock }));

type StripeModule = typeof import("@/lib/stripe");

// Fresh module per test so the cached client does not leak between tests
async function loadStripe(): Promise<StripeModule> {
  vi.resetModules();
  return import("@/lib/stripe");
}

beforeEach(() => {
  StripeMock.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getStripe", () => {
  it("throws when STRIPE_SECRET_KEY is missing", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const { getStripe } = await loadStripe();

    expect(() => getStripe()).toThrow("Stripe is not configured");
    expect(StripeMock).not.toHaveBeenCalled();
  });

  it("creates the client once and returns the same instance", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    const { getStripe } = await loadStripe();

    const first = getStripe();
    const second = getStripe();

    expect(first).toBe(second);
    expect(StripeMock).toHaveBeenCalledTimes(1);
    expect(StripeMock).toHaveBeenCalledWith("sk_test_123", { appInfo: { name: "DevStash" } });
  });
});

describe("getPriceId", () => {
  it("returns the price id for each billing period", async () => {
    vi.stubEnv("STRIPE_PRICE_ID_MONTHLY", "price_month");
    vi.stubEnv("STRIPE_PRICE_ID_YEARLY", "price_year");
    const { getPriceId } = await loadStripe();

    expect(getPriceId("monthly")).toBe("price_month");
    expect(getPriceId("yearly")).toBe("price_year");
  });

  it("throws when the price id is missing", async () => {
    vi.stubEnv("STRIPE_PRICE_ID_MONTHLY", "");
    vi.stubEnv("STRIPE_PRICE_ID_YEARLY", "");
    const { getPriceId } = await loadStripe();

    expect(() => getPriceId("monthly")).toThrow("Stripe monthly price is not configured");
    expect(() => getPriceId("yearly")).toThrow("Stripe yearly price is not configured");
  });
});

describe("getAppUrl", () => {
  it("uses AUTH_URL when set", async () => {
    vi.stubEnv("AUTH_URL", "https://devstash.example");
    const { getAppUrl } = await loadStripe();

    expect(getAppUrl()).toBe("https://devstash.example");
  });

  it("falls back to localhost", async () => {
    vi.stubEnv("AUTH_URL", "");
    const { getAppUrl } = await loadStripe();

    expect(getAppUrl()).toBe("http://localhost:3000");
  });
});
