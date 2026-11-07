import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface ItemSummaryType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ItemSummary {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  itemType: ItemSummaryType;
  tags: string[];
}

export interface ItemDetail extends ItemSummary {
  contentType: "TEXT" | "FILE" | "URL";
  content: string | null;
  language: string | null;
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  updatedAt: Date;
  collections: { id: string; name: string }[];
}

export interface ItemStats {
  total: number;
  favorites: number;
}

export interface SidebarItemType extends ItemSummaryType {
  count: number;
}

// Display order for system types in the sidebar
export const SYSTEM_TYPE_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

const itemSummarySelect = {
  id: true,
  title: true,
  description: true,
  isFavorite: true,
  isPinned: true,
  createdAt: true,
  itemType: { select: { id: true, name: true, icon: true, color: true } },
  tags: { select: { name: true }, orderBy: { name: "asc" } },
} satisfies Prisma.ItemSelect;

async function findItemSummaries(
  userId: string,
  args: Pick<Prisma.ItemFindManyArgs, "where" | "take">,
): Promise<ItemSummary[]> {
  const items = await prisma.item.findMany({
    where: { ...args.where, userId },
    orderBy: { createdAt: "desc" },
    take: args.take,
    select: itemSummarySelect,
  });

  return items.map(({ tags, ...item }) => ({
    ...item,
    tags: tags.map((tag) => tag.name),
  }));
}

export function getPinnedItems(
  userId: string,
  limit = 10,
): Promise<ItemSummary[]> {
  return findItemSummaries(userId, { where: { isPinned: true }, take: limit });
}

export function getRecentItems(
  userId: string,
  limit = 10,
): Promise<ItemSummary[]> {
  return findItemSummaries(userId, { take: limit });
}

export function getItemsByType(
  userId: string,
  typeName: string,
): Promise<ItemSummary[]> {
  return findItemSummaries(userId, { where: { itemType: { name: typeName } } });
}

// Readable only by its owner
export async function getItemDetail(
  id: string,
  userId: string,
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id, userId },
    select: {
      ...itemSummarySelect,
      contentType: true,
      content: true,
      language: true,
      url: true,
      fileName: true,
      fileSize: true,
      updatedAt: true,
      collections: {
        select: { collection: { select: { id: true, name: true } } },
        orderBy: { collection: { name: "asc" } },
      },
    },
  });
  if (!item) return null;

  const { tags, collections, ...rest } = item;
  return {
    ...rest,
    tags: tags.map((tag) => tag.name),
    collections: collections.map((c) => c.collection),
  };
}

export async function getItemStats(userId: string): Promise<ItemStats> {
  const where = { userId };
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where }),
    prisma.item.count({ where: { ...where, isFavorite: true } }),
  ]);

  return { total, favorites };
}

async function findItemTypeCounts(
  where: Prisma.ItemWhereInput,
): Promise<SidebarItemType[]> {
  const [types, counts] = await Promise.all([
    prisma.itemType.findMany({
      where: { isSystem: true },
      select: { id: true, name: true, icon: true, color: true },
    }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where,
      _count: { _all: true },
    }),
  ]);

  const countByType = new Map(
    counts.map((c) => [c.itemTypeId, c._count._all]),
  );

  return types
    .map((type) => ({ ...type, count: countByType.get(type.id) ?? 0 }))
    .sort(
      (a, b) =>
        SYSTEM_TYPE_ORDER.indexOf(a.name) - SYSTEM_TYPE_ORDER.indexOf(b.name),
    );
}

export function getUserItemTypeCounts(userId: string): Promise<SidebarItemType[]> {
  return findItemTypeCounts({ userId });
}
