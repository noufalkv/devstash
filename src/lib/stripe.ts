import Stripe from "stripe";

export type Billing = "monthly" | "yearly";

let client: Stripe | null = null;

// Created on first use so the app runs without Stripe configured. The SDK pins its own API version.
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  client ??= new Stripe(key, { appInfo: { name: "DevStash" } });
  return client;
}

export function getPriceId(billing: Billing): string {
  const id =
    billing === "monthly"
      ? process.env.STRIPE_PRICE_ID_MONTHLY
      : process.env.STRIPE_PRICE_ID_YEARLY;
  if (!id) throw new Error(`Stripe ${billing} price is not configured`);
  return id;
}

export function getAppUrl(): string {
  return process.env.AUTH_URL || "http://localhost:3000";
}
