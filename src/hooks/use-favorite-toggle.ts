"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { FavoriteState } from "@/lib/db/items";

interface FavoriteResult {
  success: boolean;
  data?: FavoriteState;
  error?: string;
}

/**
 * Optimistic favorite toggle: the star flips at once, the server action sets the
 * new value, and a refresh updates every list that shows favorites. On failure
 * the star flips back and an error toast shows.
 */
export function useFavoriteToggle(
  isFavorite: boolean,
  save: (isFavorite: boolean) => Promise<FavoriteResult>,
  onSaved?: (state: FavoriteState) => void,
) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(isFavorite);

  function toggle() {
    if (isPending) return;
    const next = !optimisticFavorite;

    startTransition(async () => {
      setOptimisticFavorite(next);
      const result = await save(next);

      if (!result.success || !result.data) {
        toast.error(result.error ?? "Could not update favorite");
        return;
      }

      toast.success(next ? "Added to favorites" : "Removed from favorites");
      onSaved?.(result.data);
      // Inside the transition, so the optimistic value holds until fresh data arrives
      router.refresh();
    });
  }

  return { isFavorite: optimisticFavorite, isPending, toggle };
}
