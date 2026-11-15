"use client";

import Link from "next/link";
import { Star } from "lucide-react";

import { SidebarCollections } from "@/components/layout/sidebar-collections";
import { SIDEBAR_LINK_CLASS } from "@/components/layout/sidebar-section";
import { SidebarTypes } from "@/components/layout/sidebar-types";
import { SidebarUserMenu } from "@/components/layout/sidebar-user-menu";
import type { CollectionSummary } from "@/lib/db/collections";
import type { SidebarItemType } from "@/lib/db/items";
import type { SidebarUser } from "@/lib/db/users";

export interface SidebarData {
  itemTypes: SidebarItemType[];
  collections: CollectionSummary[];
  user: SidebarUser | null;
}

interface SidebarNavProps extends SidebarData {
  onNavigate?: () => void;
}

export function SidebarNav({
  itemTypes,
  collections,
  user,
  onNavigate,
}: SidebarNavProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Link href="/favorites" onClick={onNavigate} className={SIDEBAR_LINK_CLASS}>
          <Star className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">Favorites</span>
        </Link>
        <SidebarTypes itemTypes={itemTypes} onNavigate={onNavigate} />
        <SidebarCollections collections={collections} onNavigate={onNavigate} />
      </div>
      <SidebarUserMenu user={user} onNavigate={onNavigate} />
    </div>
  );
}
