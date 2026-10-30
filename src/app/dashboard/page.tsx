import { FolderOpen, Heart, LayoutGrid, Pin, Star } from "lucide-react";

import { CollectionCard } from "@/components/dashboard/collection-card";
import { ItemRow } from "@/components/dashboard/item-row";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { mockCollections, mockItems } from "@/lib/mock-data";

const stats = [
  { label: "Items", value: mockItems.length, icon: LayoutGrid },
  { label: "Collections", value: mockCollections.length, icon: FolderOpen },
  {
    label: "Favorite Items",
    value: mockItems.filter((item) => item.isFavorite).length,
    icon: Heart,
  },
  {
    label: "Favorite Collections",
    value: mockCollections.filter((collection) => collection.isFavorite).length,
    icon: Star,
  },
];

const recentCollections = [...mockCollections]
  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  .slice(0, 6);

const pinnedItems = mockItems
  .filter((item) => item.isPinned)
  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

const recentItems = [...mockItems]
  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  .slice(0, 10);

export default function DashboardPage() {
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

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Pin className="size-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Pinned</h2>
        </div>
        {pinnedItems.length > 0 ? (
          <Card>
            <CardContent className="flex flex-col">
              {pinnedItems.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">No pinned items yet.</p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Recent Items</h2>
        <Card>
          <CardContent className="flex flex-col">
            {recentItems.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
