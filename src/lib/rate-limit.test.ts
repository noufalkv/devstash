import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, getClientIp, rateLimitMessage, rateLimitResponse } from "./rate-limit";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("getClientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    const headers = new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" });
    expect(getClientIp(headers)).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("checkRateLimit", () => {
  it("fails open when Upstash is not configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    await expect(checkRateLimit("login", "1.1.1.1")).resolves.toEqual({
      success: true,
      remaining: 5,
      reset: 0,
    });
  });
});

describe("rateLimitMessage", () => {
  it("rounds up to whole minutes and pluralizes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    expect(rateLimitMessage(30_000)).toBe("Too many attempts. Please try again in 1 minute.");
    expect(rateLimitMessage(90_000)).toBe("Too many attempts. Please try again in 2 minutes.");
  });
});

describe("rateLimitResponse", () => {
  it("returns a 429 with Retry-After", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const response = rateLimitResponse(120_000);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("120");
    expect(await response.json()).toMatchObject({ success: false });
  });
});
