"use client";

import { defaultFilter } from "cmdk";
import { FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";

import { useItemDrawer } from "@/components/items/item-drawer-provider";
import { ItemTypeIcon } from "@/components/items/item-type-icon";
import { useCommandPalette } from "@/components/search/command-palette-provider";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { SearchItem } from "@/lib/db/items";

export interface SearchCollection {
  id: string;
  name: string;
  itemCount: number;
}

interface CommandPaletteProps {
  items: SearchItem[];
  collections: SearchCollection[];
}

// Score only the keywords (title, type, preview), so ids in the item values never match.
function filterByKeywords(_value: string, search: string, keywords?: string[]) {
  return defaultFilter(keywords?.join(" ") ?? "", search);
}

export function CommandPalette({ items, collections }: CommandPaletteProps) {
  const { open, setOpen } = useCommandPalette();
  const { openItem } = useItemDrawer();
  const router = useRouter();

  function selectItem(id: string) {
    setOpen(false);
    openItem(id);
  }

  function selectCollection(id: string) {
    setOpen(false);
    router.push(`/collections/${encodeURIComponent(id)}`);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search your items and collections"
      className="sm:max-w-xl"
    >
      <CommandPalettePanel
        items={items}
        collections={collections}
        onSelectItem={selectItem}
        onSelectCollection={selectCollection}
      />
    </CommandDialog>
  );
}

interface CommandPalettePanelProps extends CommandPaletteProps {
  onSelectItem: (id: string) => void;
  onSelectCollection: (id: string) => void;
}

function CommandPalettePanel({
  items,
  collections,
  onSelectItem,
  onSelectCollection,
}: CommandPalettePanelProps) {
  return (
    <Command filter={filterByKeywords}>
      <CommandInput placeholder="Search items and collections..." />
      <CommandList className="max-h-96">
        <CommandEmpty>No results found.</CommandEmpty>

        {items.length > 0 && (
          <CommandGroup heading="Items">
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={`item:${item.id}`}
                keywords={[item.title, item.itemType.name, item.preview ?? ""]}
                onSelect={() => onSelectItem(item.id)}
              >
                <ItemTypeIcon itemType={item.itemType} size="xs" labelled />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  {item.preview && (
                    <p className="truncate text-xs text-muted-foreground">
                      {item.preview}
                    </p>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {items.length > 0 && collections.length > 0 && <CommandSeparator />}

        {collections.length > 0 && (
          <CommandGroup heading="Collections">
            {collections.map((collection) => (
              <CommandItem
                key={collection.id}
                value={`collection:${collection.id}`}
                keywords={[collection.name]}
                onSelect={() => onSelectCollection(collection.id)}
              >
                <FolderOpen className="text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {collection.name}
                </span>
                <span
                  data-slot="command-shortcut"
                  className="shrink-0 text-xs text-muted-foreground"
                >
                  {collection.itemCount}{" "}
                  {collection.itemCount === 1 ? "item" : "items"}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
