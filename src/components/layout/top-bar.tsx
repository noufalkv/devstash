"use client";

import Link from "next/link";
import { useState } from "react";
import { FolderPlus, PanelLeft, Plus, Search, Star } from "lucide-react";

import { NewCollectionDialog } from "@/components/collections/new-collection-dialog";
import { NewItemDialog } from "@/components/items/new-item-dialog";
import { useSidebar } from "@/components/layout/sidebar-provider";
import { useCommandPalette } from "@/components/search/command-palette-provider";
import { LogoMark } from "@/components/shared/logo-mark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CreateDialog = "item" | "collection" | null;

const SEARCH_LABEL = "Search items and collections";
const SEARCH_SHORTCUTS = "Meta+K Control+K";

/** Below `md`: a single "+" button whose menu opens the New Item or New Collection dialog. */
function CreateMenu({ onSelect }: { onSelect: (dialog: CreateDialog) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button size="icon" aria-label="Create" className="md:hidden" />}
      >
        <Plus className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onSelect("item")}>
          <Plus />
          New Item
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("collection")}>
          <FolderPlus />
          New Collection
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TopBar() {
  const { toggleSidebar } = useSidebar();
  const { setOpen: setPaletteOpen } = useCommandPalette();
  const [createDialog, setCreateDialog] = useState<CreateDialog>(null);

  const openPalette = () => setPaletteOpen(true);
  const dialogOpenChange = (dialog: CreateDialog) => (open: boolean) =>
    setCreateDialog(open ? dialog : null);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-3 sm:gap-4 sm:px-4">
      <Button
        variant="outline"
        size="icon"
        aria-label="Toggle sidebar"
        onClick={toggleSidebar}
      >
        <PanelLeft className="size-4" />
      </Button>

      <Link
        href="/dashboard"
        aria-label="DevStash dashboard"
        className="flex shrink-0 items-center gap-2 font-semibold"
      >
        <LogoMark className="size-7" iconClassName="size-4" />
        <span className="hidden sm:inline">DevStash</span>
      </Link>

      <button
        type="button"
        onClick={openPalette}
        aria-label={SEARCH_LABEL}
        aria-keyshortcuts={SEARCH_SHORTCUTS}
        className="mx-auto hidden h-8 w-full max-w-md min-w-0 items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-sm text-muted-foreground transition-colors outline-none hover:bg-input/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex dark:bg-input/30 dark:hover:bg-input/50"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">Search items...</span>
        <kbd className="pointer-events-none shrink-0 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
        <Button
          variant="outline"
          size="icon"
          aria-label={SEARCH_LABEL}
          aria-keyshortcuts={SEARCH_SHORTCUTS}
          className="sm:hidden"
          onClick={openPalette}
        >
          <Search className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Favorites"
          title="Favorites"
          className="hidden md:inline-flex"
          render={<Link href="/favorites" />}
          nativeButton={false}
        >
          <Star className="size-4" />
        </Button>
        <Button
          variant="outline"
          className="hidden md:inline-flex"
          onClick={() => setCreateDialog("collection")}
        >
          <FolderPlus />
          New Collection
        </Button>
        <Button
          className="hidden md:inline-flex"
          onClick={() => setCreateDialog("item")}
        >
          <Plus />
          New Item
        </Button>
        <CreateMenu onSelect={setCreateDialog} />
      </div>

      <NewItemDialog
        open={createDialog === "item"}
        onOpenChange={dialogOpenChange("item")}
      />
      <NewCollectionDialog
        open={createDialog === "collection"}
        onOpenChange={dialogOpenChange("collection")}
      />
    </header>
  );
}
