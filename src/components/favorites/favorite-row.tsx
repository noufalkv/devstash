"use client";

import Link from "next/link";
import { Folder } from "lucide-react";

import { useItemDrawer } from "@/components/items/item-drawer-provider";
import type { FavoriteCollection } from "@/lib/db/collections";
import type { FavoriteItem } from "@/lib/db/items";
import { formatDate } from "@/lib/format-date";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";

const ROW_CLASS =
  "flex w-full items-center gap-3 px-2 py-1.5 text-left font-mono text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring";

interface RowContentProps {
  icon: React.ReactNode;
  title: string;
  badge: string;
  /** The badge's text and border color; muted when omitted. */
  color?: string;
  meta?: string;
  date: Date;
}

function RowContent({ icon, title, badge, color, meta, date }: RowContentProps) {
  return (
    <>
      <span className="flex size-4 shrink-0 items-center justify-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {meta && (
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
          {meta}
        </span>
      )}
      <span
        className="shrink-0 rounded-sm border px-1.5 text-[11px] leading-4 text-muted-foreground"
        style={
          color
            ? {
                color,
                borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
              }
            : undefined
        }
      >
        {badge}
      </span>
      <time
        dateTime={date.toISOString()}
        className="w-24 shrink-0 text-right text-xs whitespace-nowrap text-muted-foreground"
      >
        {formatDate(date, "medium")}
      </time>
    </>
  );
}

/** A favorite item; clicking it opens the item drawer. */
export function FavoriteItemRow({ item }: { item: FavoriteItem }) {
  const { openItem } = useItemDrawer();
  const { color } = item.itemType;
  const Icon = ITEM_TYPE_ICONS[item.itemType.icon];

  return (
    <button type="button" onClick={() => openItem(item.id)} className={ROW_CLASS}>
      <RowContent
        icon={Icon && <Icon className="size-4" style={{ color }} aria-hidden />}
        title={item.title}
        badge={item.itemType.name}
        color={color}
        date={item.updatedAt}
      />
    </button>
  );
}

/** A favorite collection; links to its page. */
export function FavoriteCollectionRow({
  collection,
}: {
  collection: FavoriteCollection;
}) {
  const type = collection.topItemType;
  const Icon = (type && ITEM_TYPE_ICONS[type.icon]) || Folder;

  return (
    <Link href={`/collections/${collection.id}`} className={ROW_CLASS}>
      <RowContent
        icon={
          <Icon
            className="size-4 text-muted-foreground"
            style={type ? { color: type.color } : undefined}
            aria-hidden
          />
        }
        title={collection.name}
        badge="collection"
        meta={`${collection.itemCount} ${collection.itemCount === 1 ? "item" : "items"}`}
        date={collection.updatedAt}
      />
    </Link>
  );
}
