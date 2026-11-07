import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const RATE_LIMITS = {
  login: { limit: 5, window: "15 m" },
  register: { limit: 3, window: "1 h" },
  forgotPassword: { limit: 3, window: "1 h" },
  resetPassword: { limit: 5, window: "15 m" },
  resendVerification: { limit: 3, window: "15 m" },
} as const;

export type RateLimitName = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

// Don't let a slow Upstash call block auth; a timeout lets the request through.
const TIMEOUT_MS = 2000;

let redis: Redis | null = null;
const limiters = new Map<RateLimitName, Ratelimit>();

function getLimiter(name: RateLimitName): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const existing = limiters.get(name);
  if (existing) return existing;

  redis ??= new Redis({ url, token });
  const { limit, window } = RATE_LIMITS[name];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `ratelimit:${name}`,
    timeout: TIMEOUT_MS,
  });
  limiters.set(name, limiter);
  return limiter;
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

// Fails open: if Upstash is unconfigured or unreachable the request is allowed.
export async function checkRateLimit(
  name: RateLimitName,
  identifier: string,
): Promise<RateLimitResult> {
  const { limit } = RATE_LIMITS[name];
  const limiter = getLimiter(name);
  if (!limiter) return { success: true, remaining: limit, reset: 0 };

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { success, remaining, reset };
  } catch (error) {
    console.error(`Rate limit check failed for "${name}":`, error);
    return { success: true, remaining: limit, reset: 0 };
  }
}

function retryAfterSeconds(reset: number): number {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

export function rateLimitMessage(reset: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds(reset) / 60));
  return `Too many attempts. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
}

export function rateLimitResponse(reset: number): NextResponse {
  return NextResponse.json(
    { success: false, error: rateLimitMessage(reset) },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds(reset)) } },
  );
}
