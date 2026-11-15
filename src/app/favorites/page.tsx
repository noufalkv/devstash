import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Star } from "lucide-react";

import { auth } from "@/auth";
import {
  FavoriteCollectionRow,
  FavoriteItemRow,
} from "@/components/favorites/favorite-row";
import { getFavoriteCollections } from "@/lib/db/collections";
import { getFavoriteItems } from "@/lib/db/items";

function FavoritesSection({
  title,
  count,
  emptyText,
  children,
}: {
  title: string;
  count: number;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="flex items-baseline gap-2 border-b border-border px-2 pb-1.5 font-mono text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {title}
        <span className="text-foreground/70">{count}</span>
      </h2>
      {count > 0 ? (
        <ul className="divide-y divide-border/50">{children}</ul>
      ) : (
        <p className="px-2 py-1.5 font-mono text-sm text-muted-foreground">
          {emptyText}
        </p>
      )}
    </section>
  );
}

async function FavoritesList() {
  // Reads the current time via auth(), so render at request time, not prerender
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/favorites");

  const [items, collections] = await Promise.all([
    getFavoriteItems(session.user.id),
    getFavoriteCollections(session.user.id),
  ]);

  if (items.length === 0 && collections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <Star className="size-8 text-muted-foreground" aria-hidden />
        <p className="font-medium">No favorites yet</p>
        <p className="text-sm text-muted-foreground">
          Star items and collections to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <FavoritesSection title="Items" count={items.length} emptyText="No favorite items.">
        {items.map((item) => (
          <li key={item.id}>
            <FavoriteItemRow item={item} />
          </li>
        ))}
      </FavoritesSection>
      <FavoritesSection
        title="Collections"
        count={collections.length}
        emptyText="No favorite collections."
      >
        {collections.map((collection) => (
          <li key={collection.id}>
            <FavoriteCollectionRow collection={collection} />
          </li>
        ))}
      </FavoritesSection>
    </div>
  );
}

function FavoritesListSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-8">
      {[5, 3].map((rows, section) => (
        <div key={section} className="flex flex-col gap-1">
          <div className="mb-1 h-4 w-24 rounded bg-muted" />
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="h-7 rounded bg-muted/60" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Favorites</h1>
      <Suspense fallback={<FavoritesListSkeleton />}>
        <FavoritesList />
      </Suspense>
    </div>
  );
}
