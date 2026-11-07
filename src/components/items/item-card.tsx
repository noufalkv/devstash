import { Pin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ItemSummary } from "@/lib/db/items";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function ItemCard({ item }: { item: ItemSummary }) {
  const { color } = item.itemType;
  const Icon = ITEM_TYPE_ICONS[item.itemType.icon];

  return (
    <Card
      size="sm"
      className="h-full flex-row items-start gap-3 border-l-4 border-l-border px-3"
      style={{ borderLeftColor: color }}
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
        }}
      >
        {Icon && (
          <Icon
            className="size-4"
            style={{ color }}
            aria-label={item.itemType.name}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{item.title}</p>
          {item.isPinned && (
            <Pin className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          {item.isFavorite && (
            <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
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
      <span className="shrink-0 text-xs text-muted-foreground">
        {dateFormatter.format(item.createdAt)}
      </span>
    </Card>
  );
}
