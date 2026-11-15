"use client";

import { Pin, Star } from "lucide-react";

import { useItemDrawer } from "@/components/items/item-drawer-provider";
import { ItemTypeIcon } from "@/components/items/item-type-icon";
import { QuickCopyButton } from "@/components/items/quick-copy-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ItemSummary } from "@/lib/db/items";
import { formatDate } from "@/lib/format-date";
import { getCopyText } from "@/lib/item-copy";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: ItemSummary;
  /** "grid" fills its grid cell and clamps the description to two lines; "row" is a single-line list row. */
  variant?: "grid" | "row";
}

/** An item summary that opens the item drawer when clicked. */
export function ItemCard({ item, variant = "grid" }: ItemCardProps) {
  const { openItem } = useItemDrawer();
  const copyText = getCopyText(item);

  return (
    <Card
      size="sm"
      className={cn(
        "group/item relative cursor-pointer flex-row items-start gap-3 border-l-4 border-l-border px-3 transition-colors hover:bg-muted/40 has-[[data-card-trigger]:focus-visible]:ring-2 has-[[data-card-trigger]:focus-visible]:ring-ring",
        variant === "grid" && "h-full",
      )}
      style={{ borderLeftColor: item.itemType.color }}
    >
      <ItemTypeIcon itemType={item.itemType} labelled />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {/* The button's ::after covers the whole card, so clicking anywhere opens the drawer */}
          <button
            type="button"
            data-card-trigger
            onClick={() => openItem(item.id)}
            className="min-w-0 cursor-pointer truncate text-left text-sm font-medium outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {item.title}
          </button>
          {item.isPinned && (
            <Pin className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          {item.isFavorite && (
            <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
        </div>
        {item.description && (
          <p
            className={cn(
              "text-sm text-muted-foreground",
              variant === "grid" ? "line-clamp-2" : "truncate",
            )}
          >
            {item.description}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {copyText && (
          <QuickCopyButton
            text={copyText}
            title={item.title}
            className="relative z-10"
          />
        )}
        <span className="text-xs text-muted-foreground">
          {formatDate(item.createdAt, "short")}
        </span>
      </div>
    </Card>
  );
}
