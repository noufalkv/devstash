import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Star } from "lucide-react";

import { auth } from "@/auth";
import { CollectionHeaderActions } from "@/components/collections/collection-actions";
import { FileRow } from "@/components/items/file-row";
import { ImageCard } from "@/components/items/image-card";
import { ItemCard } from "@/components/items/item-card";
import { ItemTypeIcon } from "@/components/items/item-type-icon";
import { getCollection } from "@/lib/db/collections";
import {
  getItemsByCollection,
  SYSTEM_TYPE_ORDER,
  type ItemSummary,
} from "@/lib/db/items";

const MEDIA_TYPES = ["file", "image"];
const SECTION_ORDER = [
  ...SYSTEM_TYPE_ORDER.filter((name) => !MEDIA_TYPES.includes(name)),
  ...MEDIA_TYPES,
];

async function CollectionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Reads the current time via auth(), so render at request time, not prerender
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [collection, items] = await Promise.all([
    getCollection(session.user.id, id),
    getItemsByCollection(session.user.id, id),
  ]);
  if (!collection) notFound();

  // One section per type, in sidebar order with files and images last; empty types are skipped
  const sections = SECTION_ORDER.map((typeName) =>
    items.filter((item) => item.itemType.name === typeName),
  ).filter((sectionItems) => sectionItems.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="flex min-w-0 items-center gap-2 text-3xl font-semibold">
            <span className="truncate">{collection.name}</span>
            {collection.isFavorite && (
              <Star className="size-5 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </h1>
          <CollectionHeaderActions collection={collection} />
        </div>
        {collection.description && (
          <p className="text-muted-foreground">{collection.description}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No items in this collection yet.
        </p>
      )}

      {sections.map((sectionItems) => (
        <TypeSection key={sectionItems[0].itemType.id} items={sectionItems} />
      ))}
    </div>
  );
}

function TypeSection({ items }: { items: ItemSummary[] }) {
  const { itemType } = items[0];
  const label = `${itemType.name.charAt(0).toUpperCase()}${itemType.name.slice(1)}s`;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <ItemTypeIcon itemType={itemType} />
        {label}
        <span className="text-sm font-normal text-muted-foreground">
          {items.length}
        </span>
      </h2>

      {itemType.name === "file" ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <FileRow key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) =>
            itemType.name === "image" ? (
              <ImageCard key={item.id} item={item} />
            ) : (
              <ItemCard key={item.id} item={item} />
            ),
          )}
        </div>
      )}
    </section>
  );
}

function CollectionDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-9 w-64 rounded-md bg-muted" />
        <div className="h-5 w-24 rounded-md bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<CollectionDetailSkeleton />}>
      <CollectionDetail params={params} />
    </Suspense>
  );
}
