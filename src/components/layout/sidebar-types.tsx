"use client";

import Link from "next/link";

import { SIDEBAR_LINK_CLASS, SidebarSection } from "@/components/layout/sidebar-section";
import { Badge } from "@/components/ui/badge";
import type { SidebarItemType } from "@/lib/db/items";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";

const PRO_TYPES = new Set(["file", "image"]);

function getTypeLabel(name: string) {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}s`;
}

interface SidebarTypesProps {
  itemTypes: SidebarItemType[];
  onNavigate?: () => void;
}

/** "Types" section: one link per item type with its icon, PRO badge and item count. */
export function SidebarTypes({ itemTypes, onNavigate }: SidebarTypesProps) {
  return (
    <SidebarSection title="Types" contentClassName="flex flex-col gap-0.5 pt-1">
      {itemTypes.map((type) => {
        const Icon = ITEM_TYPE_ICONS[type.icon];
        return (
          <Link
            key={type.id}
            href={`/items/${type.name}s`}
            onClick={onNavigate}
            className={SIDEBAR_LINK_CLASS}
          >
            {Icon && (
              <Icon className="size-4 shrink-0" style={{ color: type.color }} />
            )}
            <span className="flex-1 truncate">{getTypeLabel(type.name)}</span>
            {PRO_TYPES.has(type.name) && (
              <Badge
                variant="outline"
                className="h-4 px-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground"
              >
                PRO
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{type.count}</span>
          </Link>
        );
      })}
    </SidebarSection>
  );
}
