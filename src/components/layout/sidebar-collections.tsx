"use client";

import Link from "next/link";
import { Folder, Star } from "lucide-react";

import { SIDEBAR_LINK_CLASS, SidebarSection } from "@/components/layout/sidebar-section";
import type { CollectionSummary } from "@/lib/db/collections";

interface SidebarCollectionsProps {
  collections: CollectionSummary[];
  onNavigate?: () => void;
}

function CollectionGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="px-2 text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function TopTypeDot({ color }: { color: string | undefined }) {
  return (
    <span className="flex size-4 shrink-0 items-center justify-center">
      <span
        className="size-2.5 rounded-full bg-muted-foreground"
        style={color ? { backgroundColor: color } : undefined}
      />
    </span>
  );
}

/** "Collections" section: favorites (starred), recent (colored by their most-used type) and a link to all collections. */
export function SidebarCollections({ collections, onNavigate }: SidebarCollectionsProps) {
  const favoriteCollections = collections.filter((c) => c.isFavorite);
  const recentCollections = collections.filter((c) => !c.isFavorite);

  return (
    <SidebarSection title="Collections" contentClassName="flex flex-col gap-3 pt-1">
      {favoriteCollections.length > 0 && (
        <CollectionGroup label="Favorites">
          {favoriteCollections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              onClick={onNavigate}
              className={SIDEBAR_LINK_CLASS}
            >
              <Folder className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{collection.name}</span>
              <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
            </Link>
          ))}
        </CollectionGroup>
      )}

      {recentCollections.length > 0 && (
        <CollectionGroup label="Recent">
          {recentCollections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              onClick={onNavigate}
              className={SIDEBAR_LINK_CLASS}
            >
              <TopTypeDot color={collection.itemTypes[0]?.color} />
              <span className="flex-1 truncate">{collection.name}</span>
              <span className="text-xs text-muted-foreground">
                {collection.itemCount}
              </span>
            </Link>
          ))}
        </CollectionGroup>
      )}

      <Link
        href="/collections"
        onClick={onNavigate}
        className="px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        View all collections
      </Link>
    </SidebarSection>
  );
}
