"use client";

import type { PinState } from "@/lib/db/items";
import { useOptimisticToggle, type ToggleResult } from "@/hooks/use-optimistic-toggle";

const PIN_MESSAGES = {
  on: "Pinned item",
  off: "Unpinned item",
  error: "Could not update pin",
};

/** Optimistic pin toggle for an item. */
export function usePinToggle(
  isPinned: boolean,
  save: (isPinned: boolean) => Promise<ToggleResult<PinState>>,
  onSaved?: (state: PinState) => void,
) {
  const { value, isPending, toggle } = useOptimisticToggle(
    isPinned,
    save,
    PIN_MESSAGES,
    onSaved,
  );
  return { isPinned: value, isPending, toggle };
}
