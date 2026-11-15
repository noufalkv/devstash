import { isFileItemType } from "@/lib/file-upload";

export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;

// Set ENFORCE_PRO_LIMITS="true" to apply the free-tier limits (off during development).
export function isProGatingEnabled(): boolean {
  return process.env.ENFORCE_PRO_LIMITS === "true";
}

export interface UsageContext {
  isPro: boolean;
  itemCount: number;
  collectionCount: number;
}

export function getItemLimitError(ctx: UsageContext, type: string): string | null {
  if (ctx.isPro || !isProGatingEnabled()) return null;
  if (isFileItemType(type)) return "File and image uploads are a Pro feature";
  if (ctx.itemCount >= FREE_ITEM_LIMIT) {
    return `Free accounts can store up to ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`;
  }
  return null;
}

export function getCollectionLimitError(ctx: UsageContext): string | null {
  if (ctx.isPro || !isProGatingEnabled()) return null;
  if (ctx.collectionCount >= FREE_COLLECTION_LIMIT) {
    return `Free accounts can have up to ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections.`;
  }
  return null;
}

export function canUseProFeature(isPro: boolean): boolean {
  return isPro || !isProGatingEnabled();
}
