import { ItemCard } from "@/components/items/item-card";
import type { ItemSummary } from "@/lib/db/items";

/** Dashboard list row: an `ItemCard` in its single-line row layout. */
export function ItemRow({ item }: { item: ItemSummary }) {
  return <ItemCard item={item} variant="row" />;
}
