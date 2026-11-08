"use client";

import { Pin, Star } from "lucide-react";

import { useItemDrawer } from "@/components/items/item-drawer-provider";
import { Card } from "@/components/ui/card";
import type { ItemSummary } from "@/lib/db/items";

export function ImageCard({ item }: { item: ItemSummary }) {
  const { openItem } = useItemDrawer();

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => openItem(item.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openItem(item.id);
        }
      }}
      className="group h-full cursor-pointer gap-0 overflow-hidden py-0 transition-colors hover:bg-muted/40"
    >
      <div className="aspect-video overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- owner-checked proxy URL, not optimizable */}
        <img
          src={`/api/download/${item.id}?inline=1`}
          alt={item.title}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex items-center gap-1.5 px-3 py-2">
        <p className="truncate text-sm font-medium">{item.title}</p>
        {item.isPinned && (
          <Pin className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        {item.isFavorite && (
          <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
        )}
      </div>
    </Card>
  );
}
