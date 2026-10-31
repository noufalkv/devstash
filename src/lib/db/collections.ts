import { prisma } from "@/lib/prisma";

// No auth yet — scope all dashboard queries to the seeded demo user.
const DEMO_USER_EMAIL = "demo@devstash.io";

export interface CollectionItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  // Sorted by count, most-used first
  itemTypes: CollectionItemType[];
}

export interface CollectionStats {
  total: number;
  favorites: number;
}

export async function getRecentCollections(
  limit = 6,
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { user: { email: DEMO_USER_EMAIL } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      items: {
        select: {
          item: {
            select: {
              itemType: {
                select: { id: true, name: true, icon: true, color: true },
              },
            },
          },
        },
      },
    },
  });

  return collections.map(({ items, ...collection }) => {
    const typeCounts = new Map<string, CollectionItemType>();
    for (const { item } of items) {
      const existing = typeCounts.get(item.itemType.id);
      if (existing) existing.count++;
      else typeCounts.set(item.itemType.id, { ...item.itemType, count: 1 });
    }

    return {
      ...collection,
      itemCount: items.length,
      itemTypes: [...typeCounts.values()].sort((a, b) => b.count - a.count),
    };
  });
}

export async function getCollectionStats(): Promise<CollectionStats> {
  const where = { user: { email: DEMO_USER_EMAIL } };
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where }),
    prisma.collection.count({ where: { ...where, isFavorite: true } }),
  ]);

  return { total, favorites };
}
