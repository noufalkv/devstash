import { isRecordNotFound } from "@/lib/db/errors";
import { parseEditorPreferences, type EditorPreferences } from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";

export interface SidebarUser {
  name: string | null;
  email: string;
  image: string | null;
}

export function getSidebarUser(userId: string): Promise<SidebarUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true },
  });
}

export interface Profile extends SidebarUser {
  createdAt: Date;
  hasPassword: boolean;
  itemCount: number;
  collectionCount: number;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      createdAt: true,
      password: true,
      _count: { select: { items: true, collections: true } },
    },
  });
  if (!user) return null;

  const { password, _count, ...rest } = user;
  return {
    ...rest,
    hasPassword: password !== null,
    itemCount: _count.items,
    collectionCount: _count.collections,
  };
}

export async function getEditorPreferences(userId: string): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });
  return parseEditorPreferences(user?.editorPreferences);
}

// Returns null when the user no longer exists.
export async function updateEditorPreferences(
  userId: string,
  preferences: EditorPreferences,
): Promise<EditorPreferences | null> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { editorPreferences: { ...preferences } },
      select: { editorPreferences: true },
    });
    return parseEditorPreferences(user.editorPreferences);
  } catch (error) {
    if (isRecordNotFound(error)) return null;
    throw error;
  }
}

export interface BillingAccount {
  email: string;
  name: string | null;
  isPro: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export function getBillingAccount(userId: string): Promise<BillingAccount | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });
}

// Stores the id only if none is stored yet (two Checkout clicks can race), then returns
// whichever id ended up stored. Null when the user no longer exists.
export async function setStripeCustomerId(
  userId: string,
  customerId: string,
): Promise<string | null> {
  await prisma.user.updateMany({
    where: { id: userId, stripeCustomerId: null },
    data: { stripeCustomerId: customerId },
  });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  return user?.stripeCustomerId ?? null;
}

export interface SubscriptionState {
  customerId: string;
  subscriptionId: string;
  isPro: boolean;
}

// updateMany matches zero rows for an unknown customer instead of throwing.
export async function applySubscriptionState(state: SubscriptionState): Promise<void> {
  if (state.isPro) {
    await prisma.user.updateMany({
      where: { stripeCustomerId: state.customerId },
      data: { isPro: true, stripeSubscriptionId: state.subscriptionId },
    });
    return;
  }
  // Only clear the subscription we have stored, so a late event for an old one cannot revoke a newer one
  await prisma.user.updateMany({
    where: {
      stripeCustomerId: state.customerId,
      stripeSubscriptionId: state.subscriptionId,
    },
    data: { isPro: false, stripeSubscriptionId: null },
  });
}

export interface PlanUsage {
  itemCount: number;
  collectionCount: number;
}

export async function getPlanUsage(userId: string): Promise<PlanUsage> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { _count: { select: { items: true, collections: true } } },
  });
  return {
    itemCount: user?._count.items ?? 0,
    collectionCount: user?._count.collections ?? 0,
  };
}
