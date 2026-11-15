import type { FavoriteCollection } from "@/lib/db/collections";
import type { FavoriteItem } from "@/lib/db/items";
import { SYSTEM_TYPE_ORDER } from "@/lib/item-type-order";

export const FAVORITE_SORTS = ["name", "date", "type"] as const;
export type FavoriteSort = (typeof FAVORITE_SORTS)[number];

export const DEFAULT_FAVORITE_SORT: FavoriteSort = "date";

interface SortKey {
  id: string;
  name: string;
  date: Date;
  /** Item type name; null for an empty collection. */
  typeName: string | null;
}

const nameCollator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

// Known types in sidebar order, then unknown types, then no type (empty collections)
function typeRank(typeName: string | null): number {
  if (typeName === null) return SYSTEM_TYPE_ORDER.length + 1;
  const index = SYSTEM_TYPE_ORDER.indexOf(typeName);
  return index === -1 ? SYSTEM_TYPE_ORDER.length : index;
}

function byNameThenId(a: SortKey, b: SortKey): number {
  return nameCollator.compare(a.name, b.name) || a.id.localeCompare(b.id);
}

const COMPARATORS: Record<FavoriteSort, (a: SortKey, b: SortKey) => number> = {
  name: byNameThenId,
  date: (a, b) => b.date.getTime() - a.date.getTime() || byNameThenId(a, b),
  type: (a, b) =>
    typeRank(a.typeName) - typeRank(b.typeName) ||
    (a.typeName ?? "").localeCompare(b.typeName ?? "") ||
    byNameThenId(a, b),
};

function sortBy<T>(rows: readonly T[], sort: FavoriteSort, toKey: (row: T) => SortKey): T[] {
  const compare = COMPARATORS[sort];
  return rows
    .map((row) => ({ row, key: toKey(row) }))
    .sort((a, b) => compare(a.key, b.key))
    .map(({ row }) => row);
}

/** Returns a new array of favorite items in the chosen order; the input is not changed. */
export function sortFavoriteItems(
  items: readonly FavoriteItem[],
  sort: FavoriteSort,
): FavoriteItem[] {
  return sortBy(items, sort, (item) => ({
    id: item.id,
    name: item.title,
    date: item.updatedAt,
    typeName: item.itemType.name,
  }));
}

/**
 * Returns a new array of favorite collections in the chosen order; the input is not
 * changed. Type sorts by the most-used item type, with empty collections last.
 */
export function sortFavoriteCollections(
  collections: readonly FavoriteCollection[],
  sort: FavoriteSort,
): FavoriteCollection[] {
  return sortBy(collections, sort, (collection) => ({
    id: collection.id,
    name: collection.name,
    date: collection.updatedAt,
    typeName: collection.topItemType?.name ?? null,
  }));
}
