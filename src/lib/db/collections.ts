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

export function getAllCollections(
  userId: string,
): Promise<CollectionSummary[]> {
  return findCollectionSummaries(userId);
}

export interface CollectionHeader {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
}

// One of the user's collections, or null when missing or owned by someone else
export function getCollection(
  userId: string,
  id: string,
): Promise<CollectionHeader | null> {
  return prisma.collection.findFirst({
    where: { id, userId },
    select: { id: true, name: true, description: true, isFavorite: true },
  });
}

export interface CollectionOption {
  id: string;
  name: string;
}

// The user's collections for pickers, sorted by name
export function getCollectionOptions(userId: string): Promise<CollectionOption[]> {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

// The subset of ids that belong to collections owned by the user
export async function findOwnedCollectionIds(
  userId: string,
  ids: string[],
): Promise<string[]> {
  if (ids.length === 0) return [];
  const owned = await prisma.collection.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true },
  });
  return owned.map((collection) => collection.id);
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
