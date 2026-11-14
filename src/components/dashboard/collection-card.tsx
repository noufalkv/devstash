import Link from "next/link";
import { Star } from "lucide-react";

import { CollectionCardMenu } from "@/components/collections/collection-actions";
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
      className="relative h-full border-l-4 border-l-border transition-colors has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring hover:bg-muted/50"
      style={dominantColor ? { borderLeftColor: dominantColor } : undefined}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="flex min-w-0 items-center gap-1.5">
          {/* The link's ::after covers the whole card, so clicking anywhere navigates */}
          <Link
            href={`/collections/${collection.id}`}
            className="truncate outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {collection.name}
          </Link>
          {collection.isFavorite && (
            <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
        </CardTitle>
        <CollectionCardMenu
          collection={collection}
          className="relative z-10 -my-1 -mr-2 shrink-0 text-muted-foreground"
        />
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
