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

export function getPinnedItems(): Promise<ItemSummary[]> {
  return findItemSummaries({ where: { isPinned: true } });
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
