import type { ItemSummaryType } from "@/lib/db/items";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: { box: "size-7", icon: "size-3.5" },
  sm: { box: "size-9", icon: "size-4" },
  lg: { box: "size-10", icon: "size-5" },
} as const;

interface ItemTypeIconProps {
  itemType: ItemSummaryType;
  size?: keyof typeof SIZES;
  /** Names the icon for screen readers; leave false when the type is shown as text next to it. */
  labelled?: boolean;
}

/** The item type's icon on a tinted square in the type's color. */
export function ItemTypeIcon({
  itemType,
  size = "sm",
  labelled = false,
}: ItemTypeIconProps) {
  const { color } = itemType;
  const Icon = ITEM_TYPE_ICONS[itemType.icon];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        SIZES[size].box,
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
      }}
    >
      {Icon && (
        <Icon
          className={SIZES[size].icon}
          style={{ color }}
          aria-label={labelled ? itemType.name : undefined}
        />
      )}
    </div>
  );
}
