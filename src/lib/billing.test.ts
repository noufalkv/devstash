import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  retrieveSubscription: vi.fn(),
  retrieveCheckoutSession: vi.fn(),
  applySubscriptionState: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    subscriptions: { retrieve: mocks.retrieveSubscription },
    checkout: { sessions: { retrieve: mocks.retrieveCheckoutSession } },
  }),
}));
vi.mock("@/lib/db/users", () => ({
  applySubscriptionState: mocks.applySubscriptionState,
}));

import {
  getSubscriptionDetails,
  handleStripeEvent,
  syncCheckoutSession,
  syncSubscription,
} from "./billing";

interface SubscriptionFixture {
  id?: string;
  status?: string;
  customer?: string | { id: string };
  interval?: "month" | "year";
  periodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  cancelAt?: number | null;
  items?: unknown[];
}

function subscription({
  id = "sub_1",
  status = "active",
  customer = "cus_1",
  interval = "month",
  periodEnd = 1_800_000_000,
  cancelAtPeriodEnd = false,
  cancelAt = null,
  items,
}: SubscriptionFixture = {}) {
  return {
    id,
    status,
    customer,
    cancel_at_period_end: cancelAtPeriodEnd,
    cancel_at: cancelAt,
    items: {
      data: items ?? [{ current_period_end: periodEnd, price: { recurring: { interval } } }],
    },
  };
}

// Builds just enough of an event for the handler; Stripe's union type is far larger.
function event(type: string, object: Record<string, unknown>): Stripe.Event {
  return { type, data: { object } } as unknown as Stripe.Event;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.retrieveSubscription.mockResolvedValue(subscription());
  mocks.applySubscriptionState.mockResolvedValue(undefined);
});

describe("syncSubscription", () => {
  it.each(["active", "trialing", "past_due"])("treats %s as Pro", async (status) => {
    mocks.retrieveSubscription.mockResolvedValue(subscription({ status }));

    await syncSubscription("sub_1");

    expect(mocks.retrieveSubscription).toHaveBeenCalledWith("sub_1");
    expect(mocks.applySubscriptionState).toHaveBeenCalledWith({
      customerId: "cus_1",
      subscriptionId: "sub_1",
      isPro: true,
    });
  });

  it.each(["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"])(
    "treats %s as not Pro",
    async (status) => {
      mocks.retrieveSubscription.mockResolvedValue(subscription({ status }));

      await syncSubscription("sub_1");

      expect(mocks.applySubscriptionState).toHaveBeenCalledWith(
        expect.objectContaining({ isPro: false }),
      );
    },
  );

  it("reads the id from an expanded customer object", async () => {
    mocks.retrieveSubscription.mockResolvedValue(subscription({ customer: { id: "cus_9" } }));

    await syncSubscription("sub_1");

    expect(mocks.applySubscriptionState).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: "cus_9" }),
    );
  });
});

describe("handleStripeEvent", () => {
  it("syncs the subscription from a completed subscription checkout", async () => {
    await handleStripeEvent(
      event("checkout.session.completed", { mode: "subscription", subscription: "sub_2" }),
    );

    expect(mocks.retrieveSubscription).toHaveBeenCalledWith("sub_2");
  });

  it("ignores a completed checkout that is not a subscription", async () => {
    await handleStripeEvent(
      event("checkout.session.completed", { mode: "payment", subscription: null }),
    );

    expect(mocks.retrieveSubscription).not.toHaveBeenCalled();
    expect(mocks.applySubscriptionState).not.toHaveBeenCalled();
  });

  it.each([
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ])("re-fetches the subscription on %s", async (type) => {
    await handleStripeEvent(event(type, { id: "sub_3", status: "active" }));

    expect(mocks.retrieveSubscription).toHaveBeenCalledWith("sub_3");
    expect(mocks.applySubscriptionState).toHaveBeenCalledTimes(1);
  });

  it("ignores unhandled event types", async () => {
    await handleStripeEvent(event("invoice.paid", { id: "in_1" }));

    expect(mocks.retrieveSubscription).not.toHaveBeenCalled();
    expect(mocks.applySubscriptionState).not.toHaveBeenCalled();
  });

  it("propagates Stripe errors so the webhook can return 500", async () => {
    mocks.retrieveSubscription.mockRejectedValue(new Error("Stripe down"));

    await expect(
      handleStripeEvent(event("customer.subscription.updated", { id: "sub_3" })),
    ).rejects.toThrow("Stripe down");
  });
});

describe("syncCheckoutSession", () => {
  it("syncs a completed session that belongs to the user", async () => {
    mocks.retrieveCheckoutSession.mockResolvedValue({
      client_reference_id: "u1",
      status: "complete",
      subscription: "sub_1",
    });

    expect(await syncCheckoutSession("u1", "cs_1")).toBe(true);
    expect(mocks.retrieveCheckoutSession).toHaveBeenCalledWith("cs_1");
    expect(mocks.applySubscriptionState).toHaveBeenCalled();
  });

  it("rejects another user's session", async () => {
    mocks.retrieveCheckoutSession.mockResolvedValue({
      client_reference_id: "u2",
      status: "complete",
      subscription: "sub_1",
    });

    expect(await syncCheckoutSession("u1", "cs_1")).toBe(false);
    expect(mocks.applySubscriptionState).not.toHaveBeenCalled();
  });

  it("rejects an incomplete session", async () => {
    mocks.retrieveCheckoutSession.mockResolvedValue({
      client_reference_id: "u1",
      status: "open",
      subscription: null,
    });

    expect(await syncCheckoutSession("u1", "cs_1")).toBe(false);
    expect(mocks.applySubscriptionState).not.toHaveBeenCalled();
  });
});

describe("getSubscriptionDetails", () => {
  it("reads the period end from the first subscription item", async () => {
    mocks.retrieveSubscription.mockResolvedValue(
      subscription({ interval: "year", periodEnd: 1_800_000_000 }),
    );

    expect(await getSubscriptionDetails("sub_1")).toEqual({
      status: "active",
      billing: "yearly",
      currentPeriodEnd: new Date(1_800_000_000 * 1000),
      cancelAtPeriodEnd: false,
    });
  });

  it("reports monthly billing and a scheduled cancellation", async () => {
    mocks.retrieveSubscription.mockResolvedValue(
      subscription({ interval: "month", cancelAt: 1_800_000_000 }),
    );

    expect(await getSubscriptionDetails("sub_1")).toEqual(
      expect.objectContaining({ billing: "monthly", cancelAtPeriodEnd: true }),
    );
  });

  it("has no period end when the subscription has no items", async () => {
    mocks.retrieveSubscription.mockResolvedValue(subscription({ items: [] }));

    expect(await getSubscriptionDetails("sub_1")).toEqual(
      expect.objectContaining({ currentPeriodEnd: null }),
    );
  });

  it("returns null when Stripe fails", async () => {
    mocks.retrieveSubscription.mockRejectedValue(new Error("Stripe down"));

    expect(await getSubscriptionDetails("sub_1")).toBeNull();
  });
});
