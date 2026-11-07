import { Card, CardContent } from "@/components/ui/card";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import type { SidebarItemType } from "@/lib/db/items";

interface TypeBreakdownProps {
  itemTypes: SidebarItemType[];
}

export function TypeBreakdown({ itemTypes }: TypeBreakdownProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        {itemTypes.map((type) => {
          const Icon = ITEM_TYPE_ICONS[type.icon];
          return (
            <div key={type.id} className="flex items-center gap-3 py-1.5">
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-md"
                style={{
                  color: type.color,
                  backgroundColor: `color-mix(in oklch, ${type.color} 15%, transparent)`,
                }}
              >
                {Icon && <Icon className="size-4" />}
              </div>
              <span className="flex-1 text-sm capitalize">{type.name}s</span>
              <span className="text-sm font-medium tabular-nums">{type.count}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
