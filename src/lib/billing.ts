import type Stripe from "stripe";

import { applySubscriptionState } from "@/lib/db/users";
import { getStripe, type Billing } from "@/lib/stripe";

// past_due keeps Pro while Stripe retries the card; Stripe cancels (-> deleted) when retries run out.
const PRO_STATUSES: ReadonlySet<string> = new Set(["active", "trialing", "past_due"]);

export function isProStatus(status: Stripe.Subscription.Status): boolean {
  return PRO_STATUSES.has(status);
}

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer): string {
  return typeof customer === "string" ? customer : customer.id;
}

// Always re-fetches, so duplicate, retried or out-of-order events all end in the latest state.
export async function syncSubscription(subscriptionId: string): Promise<void> {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  await applySubscriptionState({
    customerId: getCustomerId(subscription.customer),
    subscriptionId: subscription.id,
    isPro: isProStatus(subscription.status),
  });
}

function getSubscriptionId(
  subscription: string | Stripe.Subscription | null,
): string | null {
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const subscriptionId = getSubscriptionId(session.subscription);
      if (session.mode === "subscription" && subscriptionId) {
        await syncSubscription(subscriptionId);
      }
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object.id);
      return;
    default:
      // Other event types are acknowledged with 200 and ignored
      return;
  }
}

// Called from /settings after the Checkout redirect, so Pro shows even while the webhook is in flight.
export async function syncCheckoutSession(userId: string, sessionId: string): Promise<boolean> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.client_reference_id !== userId || session.status !== "complete") return false;

  const subscriptionId = getSubscriptionId(session.subscription);
  if (!subscriptionId) return false;

  await syncSubscription(subscriptionId);
  return true;
}

export interface SubscriptionDetails {
  status: Stripe.Subscription.Status;
  billing: Billing;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export async function getSubscriptionDetails(
  subscriptionId: string,
): Promise<SubscriptionDetails | null> {
  try {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    const item = subscription.items.data[0];
    return {
      status: subscription.status,
      billing: item?.price.recurring?.interval === "year" ? "yearly" : "monthly",
      // Since the Basil API version, period fields live on the subscription item
      currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || subscription.cancel_at !== null,
    };
  } catch {
    // Settings still renders; it just leaves out the renewal line
    return null;
  }
}
