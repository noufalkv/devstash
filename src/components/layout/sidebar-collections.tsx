"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Folder, Star } from "lucide-react";

import { SidebarLink, SidebarSection } from "@/components/layout/sidebar-section";
import type { CollectionSummary } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

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
  const pathname = usePathname();
  const favoriteCollections = collections.filter((c) => c.isFavorite);
  const recentCollections = collections.filter((c) => !c.isFavorite);
  // Only the list page itself: collection pages highlight their own link.
  const allActive = pathname === "/collections";

  return (
    <SidebarSection title="Collections" contentClassName="flex flex-col gap-3 pt-1">
      {favoriteCollections.length > 0 && (
        <CollectionGroup label="Favorites">
          {favoriteCollections.map((collection) => (
            <SidebarLink
              key={collection.id}
              href={`/collections/${collection.id}`}
              onNavigate={onNavigate}
            >
              <Folder className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{collection.name}</span>
              <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
            </SidebarLink>
          ))}
        </CollectionGroup>
      )}

      {recentCollections.length > 0 && (
        <CollectionGroup label="Recent">
          {recentCollections.map((collection) => (
            <SidebarLink
              key={collection.id}
              href={`/collections/${collection.id}`}
              onNavigate={onNavigate}
            >
              <TopTypeDot color={collection.itemTypes[0]?.color} />
              <span className="flex-1 truncate">{collection.name}</span>
              <span className="text-xs text-muted-foreground">
                {collection.itemCount}
              </span>
            </SidebarLink>
          ))}
        </CollectionGroup>
      )}

      <Link
        href="/collections"
        onClick={onNavigate}
        aria-current={allActive ? "page" : undefined}
        className={cn(
          "px-2 text-xs text-muted-foreground hover:text-foreground",
          allActive && "font-medium text-foreground",
        )}
      >
        View all collections
      </Link>
    </SidebarSection>
  );
}
