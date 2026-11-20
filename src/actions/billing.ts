"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { getBillingAccount, setStripeCustomerId } from "@/lib/db/users";
import { getAppUrl, getPriceId, getStripe } from "@/lib/stripe";

export interface BillingActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const billingSchema = z.enum(["monthly", "yearly"]);

const GENERIC_ERROR = "Something went wrong. Please try again.";

async function getOrCreateCustomer(userId: string): Promise<string | null> {
  const account = await getBillingAccount(userId);
  if (!account) return null;
  if (account.stripeCustomerId) return account.stripeCustomerId;

  // The idempotency key makes a double click within 24 hours reuse the same customer
  const customer = await getStripe().customers.create(
    { email: account.email, name: account.name ?? undefined, metadata: { userId } },
    { idempotencyKey: `customer-${userId}` },
  );
  return setStripeCustomerId(userId, customer.id);
}

export async function createCheckoutSession(
  billing: unknown,
): Promise<BillingActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };
  if (session.user.isPro) return { success: false, error: "You already have Pro" };

  const parsed = billingSchema.safeParse(billing);
  if (!parsed.success) return { success: false, error: "Invalid plan" };

  const userId = session.user.id;
  try {
    const customerId = await getOrCreateCustomer(userId);
    if (!customerId) return { success: false, error: "Account not found" };

    const appUrl = getAppUrl();
    const checkout = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: userId,
      line_items: [{ price: getPriceId(parsed.data), quantity: 1 }],
      subscription_data: { metadata: { userId } },
      success_url: `${appUrl}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings?checkout=canceled`,
    });
    if (!checkout.url) return { success: false, error: "Could not start checkout" };
    return { success: true, data: { url: checkout.url } };
  } catch {
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function createPortalSession(): Promise<BillingActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };

  try {
    const account = await getBillingAccount(session.user.id);
    if (!account?.stripeCustomerId) {
      return { success: false, error: "No billing account yet" };
    }

    const portal = await getStripe().billingPortal.sessions.create({
      customer: account.stripeCustomerId,
      return_url: `${getAppUrl()}/settings`,
    });
    return { success: true, data: { url: portal.url } };
  } catch {
    return { success: false, error: GENERIC_ERROR };
  }
}
