"use client";

import type { FavoriteState } from "@/lib/db/items";
import { useOptimisticToggle, type ToggleResult } from "@/hooks/use-optimistic-toggle";

const FAVORITE_MESSAGES = {
  on: "Added to favorites",
  off: "Removed from favorites",
  error: "Could not update favorite",
};

/** Optimistic favorite toggle for an item or a collection. */
export function useFavoriteToggle(
  isFavorite: boolean,
  save: (isFavorite: boolean) => Promise<ToggleResult<FavoriteState>>,
  onSaved?: (state: FavoriteState) => void,
) {
  const { value, isPending, toggle } = useOptimisticToggle(
    isFavorite,
    save,
    FAVORITE_MESSAGES,
    onSaved,
  );
  return { isFavorite: value, isPending, toggle };
}
