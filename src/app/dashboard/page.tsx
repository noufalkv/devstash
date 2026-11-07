import { FolderOpen, Heart, LayoutGrid, Pin, Star } from "lucide-react";

import { CollectionCard } from "@/components/dashboard/collection-card";
import { ItemRow } from "@/components/dashboard/item-row";
import { StatCard } from "@/components/dashboard/stat-card";
import { getCollectionStats, getRecentCollections } from "@/lib/db/collections";
import { getItemStats, getPinnedItems, getRecentItems } from "@/lib/db/items";

export default async function DashboardPage() {
  const [recentCollections, collectionStats, pinnedItems, recentItems, itemStats] =
    await Promise.all([
      getRecentCollections(),
      getCollectionStats(),
      getPinnedItems(),
      getRecentItems(),
      getItemStats(),
    ]);

  const stats = [
    { label: "Items", value: itemStats.total, icon: LayoutGrid },
    { label: "Collections", value: collectionStats.total, icon: FolderOpen },
    { label: "Favorite Items", value: itemStats.favorites, icon: Heart },
    {
      label: "Favorite Collections",
      value: collectionStats.favorites,
      icon: Star,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Your developer knowledge hub</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Collections</h2>
          <span className="text-sm text-muted-foreground">View all</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>

      {pinnedItems.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Pin className="size-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Pinned</h2>
          </div>
          <div className="flex flex-col gap-3">
            {pinnedItems.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Recent Items</h2>
        <div className="flex flex-col gap-3">
          {recentItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
