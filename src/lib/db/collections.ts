import { prisma } from "@/lib/prisma";
import { isRecordNotFound } from "@/lib/db/errors";
import {
  DASHBOARD_COLLECTIONS_LIMIT,
  toSkipTake,
  type PageRequest,
  type Paginated,
} from "@/lib/pagination";

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

// Ordered by updatedAt, most recent first (id breaks ties so pages stay stable);
// all collections when take is omitted
async function findCollectionSummaries(
  userId: string,
  { skip, take }: { skip?: number; take?: number } = {},
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    skip,
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
  limit = DASHBOARD_COLLECTIONS_LIMIT,
): Promise<CollectionSummary[]> {
  return findCollectionSummaries(userId, { take: limit });
}

// Every collection the user owns, for the sidebar and the command palette
export function getSidebarCollections(
  userId: string,
): Promise<CollectionSummary[]> {
  return findCollectionSummaries(userId);
}

// One page of the user's collections, plus the total across all pages
export async function getCollectionsPage(
  userId: string,
  page: PageRequest,
): Promise<Paginated<CollectionSummary>> {
  const [rows, total] = await Promise.all([
    findCollectionSummaries(userId, toSkipTake(page)),
    prisma.collection.count({ where: { userId } }),
  ]);
  return { rows, total };
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

export type UpdateCollectionData = CreateCollectionData;

// Updates one of the user's collections; null when missing or owned by someone else
export async function updateCollection(
  userId: string,
  id: string,
  data: UpdateCollectionData,
): Promise<CollectionHeader | null> {
  try {
    return await prisma.collection.update({
      where: { id, userId },
      data: { name: data.name, description: data.description },
      select: { id: true, name: true, description: true, isFavorite: true },
    });
  } catch (error) {
    if (isRecordNotFound(error)) return null;
    throw error;
  }
}

// Deletes one of the user's collections. Items are kept: only their
// ItemCollection rows go, through the cascade on the join table.
export async function deleteCollection(
  userId: string,
  id: string,
): Promise<boolean> {
  try {
    await prisma.collection.delete({ where: { id, userId } });
    return true;
  } catch (error) {
    if (isRecordNotFound(error)) return false;
    throw error;
  }
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
