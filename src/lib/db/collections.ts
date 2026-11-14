import { prisma } from "@/lib/prisma";

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

// Ordered by updatedAt, most recent first; all collections when take is omitted
async function findCollectionSummaries(
  userId: string,
  take?: number,
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take,
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

export function getRecentCollections(
  userId: string,
  limit = 6,
): Promise<CollectionSummary[]> {
  return findCollectionSummaries(userId, limit);
}

export function getSidebarCollections(
  userId: string,
): Promise<CollectionSummary[]> {
  return findCollectionSummaries(userId);
}

export interface CreateCollectionData {
  name: string;
  description: string | null;
}

export async function createCollection(
  userId: string,
  data: CreateCollectionData,
): Promise<CollectionSummary> {
  const collection = await prisma.collection.create({
    data: { userId, name: data.name, description: data.description },
    select: { id: true, name: true, description: true, isFavorite: true },
  });

  return { ...collection, itemCount: 0, itemTypes: [] };
}

export async function getCollectionStats(
  userId: string,
): Promise<CollectionStats> {
  const where = { userId };
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where }),
    prisma.collection.count({ where: { ...where, isFavorite: true } }),
  ]);

  return { total, favorites };
}
