import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getBillingAccount: vi.fn(),
  setStripeCustomerId: vi.fn(),
  createCustomer: vi.fn(),
  createCheckout: vi.fn(),
  createPortal: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/users", () => ({
  getBillingAccount: mocks.getBillingAccount,
  setStripeCustomerId: mocks.setStripeCustomerId,
}));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    customers: { create: mocks.createCustomer },
    checkout: { sessions: { create: mocks.createCheckout } },
    billingPortal: { sessions: { create: mocks.createPortal } },
  }),
  getAppUrl: () => "https://devstash.test",
  getPriceId: (billing: string) => `price_${billing}`,
}));

import { createCheckoutSession, createPortalSession } from "./billing";

const freeAccount = {
  email: "a@b.com",
  name: "Ada",
  isPro: false,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "u1", isPro: false } });
  mocks.getBillingAccount.mockResolvedValue(freeAccount);
  mocks.createCustomer.mockResolvedValue({ id: "cus_new" });
  mocks.setStripeCustomerId.mockImplementation(async (_userId: string, id: string) => id);
  mocks.createCheckout.mockResolvedValue({ url: "https://checkout.stripe.test/cs_1" });
  mocks.createPortal.mockResolvedValue({ url: "https://billing.stripe.test/p_1" });
});

describe("createCheckoutSession", () => {
  it("requires a session", async () => {
    mocks.auth.mockResolvedValue(null);

    expect(await createCheckoutSession("monthly")).toEqual({
      success: false,
      error: "You must be signed in",
    });
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it("rejects users who already have Pro", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", isPro: true } });

    expect(await createCheckoutSession("monthly")).toEqual({
      success: false,
      error: "You already have Pro",
    });
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it("rejects an invalid plan", async () => {
    expect(await createCheckoutSession("weekly")).toEqual({
      success: false,
      error: "Invalid plan",
    });
    expect(mocks.getBillingAccount).not.toHaveBeenCalled();
  });

  it("reuses an existing Stripe customer", async () => {
    mocks.getBillingAccount.mockResolvedValue({ ...freeAccount, stripeCustomerId: "cus_old" });

    await createCheckoutSession("monthly");

    expect(mocks.createCustomer).not.toHaveBeenCalled();
    expect(mocks.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_old" }),
    );
  });

  it("creates and stores a new customer with an idempotency key", async () => {
    await createCheckoutSession("monthly");

    expect(mocks.createCustomer).toHaveBeenCalledWith(
      { email: "a@b.com", name: "Ada", metadata: { userId: "u1" } },
      { idempotencyKey: "customer-u1" },
    );
    expect(mocks.setStripeCustomerId).toHaveBeenCalledWith("u1", "cus_new");
  });

  it("uses whichever customer id ended up stored after a race", async () => {
    mocks.setStripeCustomerId.mockResolvedValue("cus_winner");

    await createCheckoutSession("yearly");

    expect(mocks.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_winner" }),
    );
  });

  it("creates a subscription checkout and returns its URL", async () => {
    const result = await createCheckoutSession("yearly");

    expect(mocks.createCheckout).toHaveBeenCalledWith({
      mode: "subscription",
      customer: "cus_new",
      client_reference_id: "u1",
      line_items: [{ price: "price_yearly", quantity: 1 }],
      subscription_data: { metadata: { userId: "u1" } },
      success_url:
        "https://devstash.test/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://devstash.test/settings?checkout=canceled",
    });
    expect(result).toEqual({
      success: true,
      data: { url: "https://checkout.stripe.test/cs_1" },
    });
  });

  it("returns an error when the account no longer exists", async () => {
    mocks.getBillingAccount.mockResolvedValue(null);

    expect(await createCheckoutSession("monthly")).toEqual({
      success: false,
      error: "Account not found",
    });
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it("returns a generic error when Stripe fails", async () => {
    mocks.createCheckout.mockRejectedValue(new Error("card_declined: secret detail"));

    expect(await createCheckoutSession("monthly")).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("createPortalSession", () => {
  it("requires a session", async () => {
    mocks.auth.mockResolvedValue(null);

    expect((await createPortalSession()).error).toBe("You must be signed in");
  });

  it("returns an error when the user has no Stripe customer", async () => {
    expect(await createPortalSession()).toEqual({
      success: false,
      error: "No billing account yet",
    });
    expect(mocks.createPortal).not.toHaveBeenCalled();
  });

  it("opens the portal for the stored customer", async () => {
    mocks.getBillingAccount.mockResolvedValue({ ...freeAccount, stripeCustomerId: "cus_old" });

    const result = await createPortalSession();

    expect(mocks.createPortal).toHaveBeenCalledWith({
      customer: "cus_old",
      return_url: "https://devstash.test/settings",
    });
    expect(result).toEqual({ success: true, data: { url: "https://billing.stripe.test/p_1" } });
  });

  it("returns a generic error when Stripe fails", async () => {
    mocks.getBillingAccount.mockResolvedValue({ ...freeAccount, stripeCustomerId: "cus_old" });
    mocks.createPortal.mockRejectedValue(new Error("Stripe down"));

    expect((await createPortalSession()).error).toBe("Something went wrong. Please try again.");
  });
});
