import { FolderOpen, Heart, LayoutGrid, Pin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { mockCollections, mockItemTypes, mockItems, type Item } from "@/lib/mock-data";

const itemTypeById = new Map(mockItemTypes.map((type) => [type.id, type]));

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

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

function ItemRow({ item }: { item: Item }) {
  const type = itemTypeById.get(item.itemTypeId);
  const Icon = type ? ITEM_TYPE_ICONS[type.icon] : null;

  return (
    <div className="flex items-start gap-3 border-b border-border py-3 last:border-b-0">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${type?.color ?? "#6b7280"}1a` }}
      >
        {Icon && <Icon className="size-4" style={{ color: type?.color }} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{item.title}</p>
          {item.isPinned && (
            <Pin className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          {item.isFavorite && (
            <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {item.description}
        </p>
        {item.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {dateFormatter.format(item.createdAt)}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Your developer knowledge hub</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <stat.icon className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Collections</h2>
          <span className="text-sm text-muted-foreground">View all</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentCollections.map((collection) => (
            <Card key={collection.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5">
                  {collection.name}
                  {collection.isFavorite && (
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5">
                <p className="text-sm text-muted-foreground">
                  {collection.itemCount} items
                </p>
                <p className="text-sm text-muted-foreground">
                  {collection.description}
                </p>
              </CardContent>
            </Card>
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
