"use client";

import Link from "next/link";
import { ChevronDown, Folder, Settings, Star } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import {
  mockCollections,
  mockItemTypeCounts,
  mockItemTypes,
  mockUser,
} from "@/lib/mock-data";

const favoriteCollections = mockCollections.filter((c) => c.isFavorite);
const recentCollections = [...mockCollections]
  .filter((c) => !c.isFavorite)
  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between py-1 text-sm font-medium text-muted-foreground hover:text-foreground">
            Types
            <ChevronDown className="size-4 transition-transform group-aria-expanded/trigger:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-0.5 pt-1">
            {mockItemTypes.map((type) => {
              const Icon = ITEM_TYPE_ICONS[type.icon];
              return (
                <Link
                  key={type.id}
                  href={`/items/${type.name}s`}
                  onClick={onNavigate}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm capitalize hover:bg-muted"
                >
                  {Icon && (
                    <Icon
                      className="size-4 shrink-0"
                      style={{ color: type.color }}
                    />
                  )}
                  <span className="flex-1 truncate">{type.name}s</span>
                  <span className="text-xs text-muted-foreground">
                    {mockItemTypeCounts[type.name] ?? 0}
                  </span>
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen>
          <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between py-1 text-sm font-medium text-muted-foreground hover:text-foreground">
            Collections
            <ChevronDown className="size-4 transition-transform group-aria-expanded/trigger:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-3 pt-1">
            {favoriteCollections.length > 0 && (
              <div className="flex flex-col gap-0.5">
                <span className="px-2 text-xs font-medium text-muted-foreground">
                  Favorites
                </span>
                {favoriteCollections.map((collection) => (
                  <Link
                    key={collection.id}
                    href={`/collections/${collection.id}`}
                    onClick={onNavigate}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <Folder className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{collection.name}</span>
                    <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                  </Link>
                ))}
              </div>
            )}

            {recentCollections.length > 0 && (
              <div className="flex flex-col gap-0.5">
                <span className="px-2 text-xs font-medium text-muted-foreground">
                  Recent
                </span>
                {recentCollections.map((collection) => (
                  <Link
                    key={collection.id}
                    href={`/collections/${collection.id}`}
                    onClick={onNavigate}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <Folder className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{collection.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {collection.itemCount}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 border-t border-border p-4">
        <Avatar>
          <AvatarFallback>{getInitials(mockUser.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{mockUser.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {mockUser.email}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Settings">
          <Settings className="size-4" />
        </Button>
      </div>
    </div>
  );
}
