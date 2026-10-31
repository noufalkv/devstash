import { Star } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CollectionSummary } from "@/lib/db/collections";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";

export function CollectionCard({
  collection,
}: {
  collection: CollectionSummary;
}) {
  const dominantColor = collection.itemTypes[0]?.color;

  return (
    <Card
      className="border-l-4 border-l-border"
      style={dominantColor ? { borderLeftColor: dominantColor } : undefined}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          {collection.name}
          {collection.isFavorite && (
            <Star className="size-4 fill-yellow-400 text-yellow-400" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        <p className="text-sm text-muted-foreground">
          {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
        </p>
        {collection.description && (
          <p className="text-sm text-muted-foreground">
            {collection.description}
          </p>
        )}
        {collection.itemTypes.length > 0 && (
          <div className="mt-1 flex items-center gap-2">
            {collection.itemTypes.map((type) => {
              const Icon = ITEM_TYPE_ICONS[type.icon];
              return Icon ? (
                <Icon
                  key={type.id}
                  className="size-4"
                  style={{ color: type.color }}
                  aria-label={type.name}
                />
              ) : null;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
