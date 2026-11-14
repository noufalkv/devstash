import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isRecordNotFound } from "@/lib/db/errors";
import {
  DASHBOARD_RECENT_ITEMS_LIMIT,
  toSkipTake,
  type PageRequest,
  type Paginated,
} from "@/lib/pagination";

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
  contentType: "TEXT" | "FILE" | "URL";
  content: string | null;
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  itemType: ItemSummaryType;
  tags: string[];
}

export interface ItemDetail extends ItemSummary {
  language: string | null;
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
  contentType: true,
  content: true,
  url: true,
  fileName: true,
  fileSize: true,
  itemType: { select: { id: true, name: true, icon: true, color: true } },
  tags: { select: { name: true }, orderBy: { name: "asc" } },
} satisfies Prisma.ItemSelect;

// Newest first; the id tie-break keeps page boundaries stable when dates match
async function findItemSummaries(
  userId: string,
  args: Pick<Prisma.ItemFindManyArgs, "where" | "skip" | "take">,
): Promise<ItemSummary[]> {
  const items = await prisma.item.findMany({
    where: { ...args.where, userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: args.skip,
    take: args.take,
    select: itemSummarySelect,
  });

  return items.map(({ tags, ...item }) => ({
    ...item,
    tags: tags.map((tag) => tag.name),
  }));
}

// One page of the user's items matching `where`, plus the total across all pages
async function findItemPage(
  userId: string,
  where: Prisma.ItemWhereInput,
  page: PageRequest,
): Promise<Paginated<ItemSummary>> {
  const [rows, total] = await Promise.all([
    findItemSummaries(userId, { where, ...toSkipTake(page) }),
    prisma.item.count({ where: { ...where, userId } }),
  ]);
  return { rows, total };
}

export function getPinnedItems(
  userId: string,
  limit = 10,
): Promise<ItemSummary[]> {
  return findItemSummaries(userId, { where: { isPinned: true }, take: limit });
}

export function getRecentItems(
  userId: string,
  limit = DASHBOARD_RECENT_ITEMS_LIMIT,
): Promise<ItemSummary[]> {
  return findItemSummaries(userId, { take: limit });
}

export function getItemsByType(
  userId: string,
  typeName: string,
  page: PageRequest,
): Promise<Paginated<ItemSummary>> {
  return findItemPage(userId, { itemType: { name: typeName } }, page);
}

export function getItemsByCollection(
  userId: string,
  collectionId: string,
  page: PageRequest,
): Promise<Paginated<ItemSummary>> {
  return findItemPage(
    userId,
    { collections: { some: { collectionId } } },
    page,
  );
}

export interface SearchItem {
  id: string;
  title: string;
  itemType: ItemSummaryType;
  preview: string | null;
}

export const SEARCH_PREVIEW_LENGTH = 80;

/** One line of the item's content, URL or file name, for search results. */
function toSearchPreview(text: string | null): string | null {
  const line = text?.replace(/\s+/g, " ").trim();
  if (!line) return null;
  return line.length > SEARCH_PREVIEW_LENGTH
    ? `${line.slice(0, SEARCH_PREVIEW_LENGTH)}…`
    : line;
}

/** Every item the user owns, trimmed to what the command palette searches. */
export async function getSearchItems(userId: string): Promise<SearchItem[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      url: true,
      fileName: true,
      itemType: { select: { id: true, name: true, icon: true, color: true } },
    },
  });

  return items.map(({ content, url, fileName, ...item }) => ({
    ...item,
    preview: toSearchPreview(url ?? fileName ?? content),
  }));
}

const itemDetailSelect = {
  ...itemSummarySelect,
  language: true,
  updatedAt: true,
  collections: {
    select: { collection: { select: { id: true, name: true } } },
    orderBy: { collection: { name: "asc" } },
  },
} satisfies Prisma.ItemSelect;

function toItemDetail(
  item: Prisma.ItemGetPayload<{ select: typeof itemDetailSelect }>,
): ItemDetail {
  const { tags, collections, ...rest } = item;
  return {
    ...rest,
    tags: tags.map((tag) => tag.name),
    collections: collections.map((c) => c.collection),
  };
}

// Readable only by its owner
export async function getItemDetail(
  id: string,
  userId: string,
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id, userId },
    select: itemDetailSelect,
  });
  return item ? toItemDetail(item) : null;
}

export interface UpdateItemData {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
  // Must already be checked to belong to the item's owner
  collectionIds: string[];
}

export interface ItemFileData {
  key: string;
  name: string;
  size: number;
}

export interface CreateItemData extends UpdateItemData {
  type: string;
  file?: ItemFileData | null;
}

// Returns null when the system item type does not exist
export async function createItem(
  userId: string,
  data: CreateItemData,
): Promise<ItemDetail | null> {
  const { type, tags, file, collectionIds, ...fields } = data;

  const itemType = await prisma.itemType.findFirst({
    where: { name: type, isSystem: true, userId: null },
    select: { id: true },
  });
  if (!itemType) return null;

  const item = await prisma.item.create({
    data: {
      ...fields,
      ...(file
        ? { fileUrl: file.key, fileName: file.name, fileSize: file.size }
        : {}),
      contentType: file ? "FILE" : type === "link" ? "URL" : "TEXT",
      userId,
      itemTypeId: itemType.id,
      tags: {
        connectOrCreate: tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
      collections: {
        create: collectionIds.map((collectionId) => ({ collectionId })),
      },
    },
    select: itemDetailSelect,
  });
  return toItemDetail(item);
}

// Writable only by its owner; returns null when the item is not found
export async function updateItem(
  id: string,
  userId: string,
  data: UpdateItemData,
): Promise<ItemDetail | null> {
  const { tags, collectionIds, ...fields } = data;

  try {
    const item = await prisma.item.update({
      where: { id, userId },
      data: {
        ...fields,
        tags: {
          set: [],
          connectOrCreate: tags.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
        // Replace memberships: drop the ones not selected, add the new ones
        collections: {
          deleteMany: { collectionId: { notIn: collectionIds } },
          createMany: {
            data: collectionIds.map((collectionId) => ({ collectionId })),
            skipDuplicates: true,
          },
        },
      },
      select: itemDetailSelect,
    });
    return toItemDetail(item);
  } catch (error) {
    if (isRecordNotFound(error)) return null;
    throw error;
  }
}

export interface ItemFileRef {
  key: string;
  name: string;
}

// An item's stored file; null when the item has none or is not owned
export async function getItemFile(
  id: string,
  userId: string,
): Promise<ItemFileRef | null> {
  const item = await prisma.item.findFirst({
    where: { id, userId },
    select: { fileUrl: true, fileName: true },
  });
  if (!item?.fileUrl) return null;
  return { key: item.fileUrl, name: item.fileName ?? "download" };
}

// Deletable only by its owner; returns false when the item is not found
export async function deleteItem(id: string, userId: string): Promise<boolean> {
  try {
    await prisma.item.delete({ where: { id, userId } });
    return true;
  } catch (error) {
    if (isRecordNotFound(error)) return false;
    throw error;
  }
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
