"use client";

import Link from "next/link";
import { ChevronDown, ChevronsUpDown, Folder, LogOut, Star } from "lucide-react";

import { signOutUser } from "@/actions/auth";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CollectionSummary } from "@/lib/db/collections";
import type { SidebarItemType } from "@/lib/db/items";
import type { SidebarUser } from "@/lib/db/users";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";

export interface SidebarData {
  itemTypes: SidebarItemType[];
  collections: CollectionSummary[];
  user: SidebarUser | null;
}

interface SidebarNavProps extends SidebarData {
  onNavigate?: () => void;
}

const PRO_TYPES = new Set(["file", "image"]);

function getTypeLabel(name: string) {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}s`;
}

export function SidebarNav({
  itemTypes,
  collections,
  user,
  onNavigate,
}: SidebarNavProps) {
  const favoriteCollections = collections.filter((c) => c.isFavorite);
  const recentCollections = collections.filter((c) => !c.isFavorite);
  const displayName = user?.name ?? user?.email ?? "Guest";

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between py-1 text-sm font-medium text-muted-foreground hover:text-foreground">
            Types
            <ChevronDown className="size-4 transition-transform group-aria-expanded/trigger:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-0.5 pt-1">
            {itemTypes.map((type) => {
              const Icon = ITEM_TYPE_ICONS[type.icon];
              return (
                <Link
                  key={type.id}
                  href={`/items/${type.name}s`}
                  onClick={onNavigate}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                >
                  {Icon && (
                    <Icon
                      className="size-4 shrink-0"
                      style={{ color: type.color }}
                    />
                  )}
                  <span className="flex-1 truncate">
                    {getTypeLabel(type.name)}
                  </span>
                  {PRO_TYPES.has(type.name) && (
                    <Badge
                      variant="outline"
                      className="h-4 px-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground"
                    >
                      PRO
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {type.count}
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
                {recentCollections.map((collection) => {
                  const topTypeColor = collection.itemTypes[0]?.color;
                  return (
                    <Link
                      key={collection.id}
                      href={`/collections/${collection.id}`}
                      onClick={onNavigate}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center">
                        <span
                          className="size-2.5 rounded-full bg-muted-foreground"
                          style={
                            topTypeColor
                              ? { backgroundColor: topTypeColor }
                              : undefined
                          }
                        />
                      </span>
                      <span className="flex-1 truncate">{collection.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {collection.itemCount}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            <Link
              href="/collections"
              onClick={onNavigate}
              className="px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              View all collections
            </Link>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 border-t border-border p-4">
        <Link
          href="/profile"
          onClick={onNavigate}
          aria-label="Profile"
          className="flex min-w-0 flex-1 items-center gap-2.5"
        >
          <UserAvatar name={displayName} image={user?.image} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {user && (
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="User menu" />
            }
          >
            <ChevronsUpDown className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-40">
            <DropdownMenuItem onClick={() => signOutUser()}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
