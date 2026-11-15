"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface ToggleResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ToggleMessages {
  on: string;
  off: string;
  error: string;
}

/**
 * Optimistic boolean toggle: the value flips at once, the server action sets the
 * new value, and a refresh updates every list that shows it. On failure the
 * value flips back and an error toast shows.
 */
export function useOptimisticToggle<T>(
  value: boolean,
  save: (value: boolean) => Promise<ToggleResult<T>>,
  messages: ToggleMessages,
  onSaved?: (state: T) => void,
) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticValue, setOptimisticValue] = useOptimistic(value);

  function toggle() {
    if (isPending) return;
    const next = !optimisticValue;

    startTransition(async () => {
      setOptimisticValue(next);
      const result = await save(next);

      if (!result.success || !result.data) {
        toast.error(result.error ?? messages.error);
        return;
      }

      toast.success(next ? messages.on : messages.off);
      onSaved?.(result.data);
      // Inside the transition, so the optimistic value holds until fresh data arrives
      router.refresh();
    });
  }

  return { value: optimisticValue, isPending, toggle };
}
