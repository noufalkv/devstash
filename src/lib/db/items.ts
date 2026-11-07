import type { Prisma } from "@/generated/prisma/client";
import { DEMO_USER_EMAIL } from "@/lib/db/demo-user";
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

export interface ItemStats {
  total: number;
  favorites: number;
}

export interface SidebarItemType extends ItemSummaryType {
  count: number;
}

// Display order for system types in the sidebar
const SYSTEM_TYPE_ORDER = [
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
  args: Pick<Prisma.ItemFindManyArgs, "where" | "take">,
): Promise<ItemSummary[]> {
  const items = await prisma.item.findMany({
    where: { ...args.where, user: { email: DEMO_USER_EMAIL } },
    orderBy: { createdAt: "desc" },
    take: args.take,
    select: itemSummarySelect,
  });

  return items.map(({ tags, ...item }) => ({
    ...item,
    tags: tags.map((tag) => tag.name),
  }));
}

export function getPinnedItems(limit = 10): Promise<ItemSummary[]> {
  return findItemSummaries({ where: { isPinned: true }, take: limit });
}

export function getRecentItems(limit = 10): Promise<ItemSummary[]> {
  return findItemSummaries({ take: limit });
}

export async function getItemStats(): Promise<ItemStats> {
  const where = { user: { email: DEMO_USER_EMAIL } };
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

export function getSidebarItemTypes(): Promise<SidebarItemType[]> {
  return findItemTypeCounts({ user: { email: DEMO_USER_EMAIL } });
}

export function getUserItemTypeCounts(userId: string): Promise<SidebarItemType[]> {
  return findItemTypeCounts({ userId });
}
