import { Pin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { mockItemTypes, type Item } from "@/lib/mock-data";

const itemTypeById = new Map(mockItemTypes.map((type) => [type.id, type]));

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function ItemRow({ item }: { item: Item }) {
  const type = itemTypeById.get(item.itemTypeId);
  const Icon = type ? ITEM_TYPE_ICONS[type.icon] : null;

  return (
    <div className="flex items-start gap-3 border-b border-border py-3 last:border-b-0">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${type?.color ?? "#6b7280"}1a` }}
      >
        {Icon && <Icon className="size-4" style={{ color: type?.color }} />}
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
        <p className="truncate text-sm text-muted-foreground">
          {item.description}
        </p>
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
    </div>
  );
}
