import { Star } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Collection } from "@/lib/mock-data";

export function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Card>
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
          {collection.itemCount} items
        </p>
        <p className="text-sm text-muted-foreground">
          {collection.description}
        </p>
      </CardContent>
    </Card>
  );
}
