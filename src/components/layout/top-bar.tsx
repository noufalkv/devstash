"use client";

import Link from "next/link";
import { Layers, PanelLeft, Search } from "lucide-react";

import { NewCollectionDialog } from "@/components/collections/new-collection-dialog";
import { NewItemDialog } from "@/components/items/new-item-dialog";
import { useSidebar } from "@/components/layout/sidebar-provider";
import { useCommandPalette } from "@/components/search/command-palette-provider";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const { toggleSidebar } = useSidebar();
  const { setOpen: setPaletteOpen } = useCommandPalette();

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border px-4">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <Layers className="size-5 text-primary" />
        <span>DevStash</span>
      </Link>

      <Button
        variant="outline"
        size="icon"
        aria-label="Toggle sidebar"
        onClick={toggleSidebar}
      >
        <PanelLeft className="size-4" />
      </Button>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        aria-label="Search items and collections"
        aria-keyshortcuts="Meta+K Control+K"
        className="mx-auto flex h-8 w-full max-w-md min-w-0 items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-sm text-muted-foreground transition-colors outline-none hover:bg-input/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">Search items...</span>
        <kbd className="pointer-events-none hidden shrink-0 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="flex shrink-0 items-center gap-2">
        <NewCollectionDialog />
        <NewItemDialog />
      </div>
    </header>
  );
}
