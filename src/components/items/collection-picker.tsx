"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { listCollectionOptions } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CollectionOption } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; collections: CollectionOption[] };

interface CollectionPickerProps {
  id?: string;
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

function useCollectionOptions(): LoadState {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    listCollectionOptions().then((result) => {
      if (cancelled) return;
      setState(
        result.success && result.data
          ? { status: "ready", collections: result.data }
          : { status: "error", message: result.error ?? "Could not load collections" },
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function CollectionPicker({
  id,
  value,
  onChange,
  disabled,
}: CollectionPickerProps) {
  const state = useCollectionOptions();

  if (state.status === "loading") {
    return <p className="text-sm text-muted-foreground">Loading collections...</p>;
  }
  if (state.status === "error") {
    return <p className="text-sm text-destructive">{state.message}</p>;
  }
  if (state.collections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No collections yet. Create one with New Collection.
      </p>
    );
  }

  const selected = new Set(value);
  const selectedNames = state.collections
    .filter((collection) => selected.has(collection.id))
    .map((collection) => collection.name);

  function toggle(id: string, checked: boolean) {
    onChange(checked ? [...value, id] : value.filter((v) => v !== id));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            id={id}
            className="w-full justify-between font-normal"
          />
        }
      >
        <span
          className={cn("truncate", selectedNames.length === 0 && "text-muted-foreground")}
        >
          {selectedNames.length > 0 ? selectedNames.join(", ") : "Select collections"}
        </span>
        <ChevronDown className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-64">
        {state.collections.map((collection) => (
          <DropdownMenuCheckboxItem
            key={collection.id}
            checked={selected.has(collection.id)}
            onCheckedChange={(checked) => toggle(collection.id, checked)}
          >
            <span className="truncate">{collection.name}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
