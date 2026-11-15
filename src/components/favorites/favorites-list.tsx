"use client";

import { useMemo, useState } from "react";

import {
  FavoriteCollectionRow,
  FavoriteItemRow,
} from "@/components/favorites/favorite-row";
import type { FavoriteCollection } from "@/lib/db/collections";
import type { FavoriteItem } from "@/lib/db/items";
import {
  DEFAULT_FAVORITE_SORT,
  FAVORITE_SORTS,
  sortFavoriteCollections,
  sortFavoriteItems,
  type FavoriteSort,
} from "@/lib/favorites-sort";

const SORT_LABELS: Record<FavoriteSort, string> = {
  name: "Name",
  date: "Date",
  type: "Type",
};

/** Name / Date / Type segmented control, built from native radios for keyboard support. */
function SortControl({
  value,
  onChange,
}: {
  value: FavoriteSort;
  onChange: (sort: FavoriteSort) => void;
}) {
  return (
    <fieldset className="flex items-center gap-2 font-mono text-xs">
      <legend className="sr-only">Sort favorites by</legend>
      <span aria-hidden className="text-muted-foreground">
        sort:
      </span>
      <div className="flex rounded-md border border-border p-0.5">
        {FAVORITE_SORTS.map((sort) => (
          <label
            key={sort}
            // Highlight from React state, not :checked, so it can't drift from the sort shown
            data-active={value === sort || undefined}
            className="cursor-pointer rounded-sm px-2 py-0.5 text-muted-foreground transition-colors hover:text-foreground data-active:bg-muted data-active:text-foreground has-focus-visible:ring-1 has-focus-visible:ring-ring"
          >
            <input
              type="radio"
              name="favorites-sort"
              value={sort}
              checked={value === sort}
              onChange={() => onChange(sort)}
              className="sr-only"
            />
            {SORT_LABELS[sort]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function FavoritesSection({
  title,
  count,
  emptyText,
  children,
}: {
  title: string;
  count: number;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="flex items-baseline gap-2 border-b border-border px-2 pb-1.5 font-mono text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {title}
        <span className="text-foreground/70">{count}</span>
      </h2>
      {count > 0 ? (
        <ul className="divide-y divide-border/50">{children}</ul>
      ) : (
        <p className="px-2 py-1.5 font-mono text-sm text-muted-foreground">
          {emptyText}
        </p>
      )}
    </section>
  );
}

/** Favorite items and collections with a client-side sort control. */
export function FavoritesList({
  items,
  collections,
}: {
  items: FavoriteItem[];
  collections: FavoriteCollection[];
}) {
  const [sort, setSort] = useState<FavoriteSort>(DEFAULT_FAVORITE_SORT);
  const sortedItems = useMemo(() => sortFavoriteItems(items, sort), [items, sort]);
  const sortedCollections = useMemo(
    () => sortFavoriteCollections(collections, sort),
    [collections, sort],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <SortControl value={sort} onChange={setSort} />
      </div>
      <div className="flex flex-col gap-8">
        <FavoritesSection
          title="Items"
          count={sortedItems.length}
          emptyText="No favorite items."
        >
          {sortedItems.map((item) => (
            <li key={item.id}>
              <FavoriteItemRow item={item} />
            </li>
          ))}
        </FavoritesSection>
        <FavoritesSection
          title="Collections"
          count={sortedCollections.length}
          emptyText="No favorite collections."
        >
          {sortedCollections.map((collection) => (
            <li key={collection.id}>
              <FavoriteCollectionRow collection={collection} />
            </li>
          ))}
        </FavoritesSection>
      </div>
    </div>
  );
}
