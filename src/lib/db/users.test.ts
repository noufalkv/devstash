import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, update, updateMany } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique, update, updateMany } } }));

import {
  applySubscriptionState,
  getBillingAccount,
  getEditorPreferences,
  getPlanUsage,
  setStripeCustomerId,
  updateEditorPreferences,
} from "@/lib/db/users";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";

const preferences = {
  fontSize: 16,
  tabSize: 8,
  wordWrap: false,
  minimap: true,
  theme: "monokai",
} as const;

const notFound = Object.assign(new Error("Record not found"), { code: "P2025" });

beforeEach(() => {
  findUnique.mockReset();
  update.mockReset();
  updateMany.mockReset();
  updateMany.mockResolvedValue({ count: 1 });
});

describe("getEditorPreferences", () => {
  it("reads the signed-in user's stored preferences", async () => {
    findUnique.mockResolvedValue({ editorPreferences: preferences });

    expect(await getEditorPreferences("u1")).toEqual(preferences);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: { editorPreferences: true },
    });
  });

  it("returns the defaults when nothing is stored", async () => {
    findUnique.mockResolvedValue({ editorPreferences: null });

    expect(await getEditorPreferences("u1")).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns the defaults when the user does not exist", async () => {
    findUnique.mockResolvedValue(null);

    expect(await getEditorPreferences("u1")).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });
});

describe("updateEditorPreferences", () => {
  it("writes the preferences to the user's row", async () => {
    update.mockResolvedValue({ editorPreferences: preferences });

    expect(await updateEditorPreferences("u1", preferences)).toEqual(preferences);
    expect(update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { editorPreferences: preferences },
      select: { editorPreferences: true },
    });
  });

  it("returns null when the user does not exist", async () => {
    update.mockRejectedValue(notFound);

    expect(await updateEditorPreferences("u1", preferences)).toBeNull();
  });

  it("rethrows other errors", async () => {
    update.mockRejectedValue(new Error("db down"));

    await expect(updateEditorPreferences("u1", preferences)).rejects.toThrow("db down");
  });
});

describe("getBillingAccount", () => {
  it("selects the billing fields for the user", async () => {
    const account = {
      email: "a@b.dev",
      name: "A",
      isPro: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
    findUnique.mockResolvedValue(account);

    expect(await getBillingAccount("u1")).toEqual(account);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: {
        email: true,
        name: true,
        isPro: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });
  });
});

describe("setStripeCustomerId", () => {
  it("only writes when no customer id is stored", async () => {
    findUnique.mockResolvedValue({ stripeCustomerId: "cus_new" });

    expect(await setStripeCustomerId("u1", "cus_new")).toBe("cus_new");
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "u1", stripeCustomerId: null },
      data: { stripeCustomerId: "cus_new" },
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: { stripeCustomerId: true },
    });
  });

  it("returns the already stored id when another request won the race", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    findUnique.mockResolvedValue({ stripeCustomerId: "cus_first" });

    expect(await setStripeCustomerId("u1", "cus_second")).toBe("cus_first");
  });

  it("returns null when the user does not exist", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    findUnique.mockResolvedValue(null);

    expect(await setStripeCustomerId("u1", "cus_new")).toBeNull();
  });
});

describe("applySubscriptionState", () => {
  it("grants Pro by customer id and stores the subscription", async () => {
    await applySubscriptionState({ customerId: "cus_1", subscriptionId: "sub_1", isPro: true });

    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_1" },
      data: { isPro: true, stripeSubscriptionId: "sub_1" },
    });
  });

  it("revokes Pro only when the stored subscription matches", async () => {
    await applySubscriptionState({ customerId: "cus_1", subscriptionId: "sub_old", isPro: false });

    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_old" },
      data: { isPro: false, stripeSubscriptionId: null },
    });
  });

  it("succeeds quietly for an unknown customer", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    await expect(
      applySubscriptionState({ customerId: "cus_x", subscriptionId: "sub_x", isPro: true }),
    ).resolves.toBeUndefined();
  });
});

describe("getPlanUsage", () => {
  it("maps the item and collection counts", async () => {
    findUnique.mockResolvedValue({ _count: { items: 12, collections: 2 } });

    expect(await getPlanUsage("u1")).toEqual({ itemCount: 12, collectionCount: 2 });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: { _count: { select: { items: true, collections: true } } },
    });
  });

  it("returns zeros when the user does not exist", async () => {
    findUnique.mockResolvedValue(null);

    expect(await getPlanUsage("u1")).toEqual({ itemCount: 0, collectionCount: 0 });
  });
});
