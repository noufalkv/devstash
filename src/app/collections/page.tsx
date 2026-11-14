import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { CollectionCard } from "@/components/dashboard/collection-card";
import { getAllCollections } from "@/lib/db/collections";

async function CollectionsGrid() {
  // Reads the current time via auth(), so render at request time, not prerender
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const collections = await getAllCollections(session.user.id);

  return (
    <>
      <p className="text-muted-foreground">
        {collections.length} {collections.length === 1 ? "collection" : "collections"}
      </p>

      {collections.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No collections yet.</p>
      )}
    </>
  );
}

function CollectionsGridSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="h-5 w-32 rounded-md bg-muted" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Collections</h1>
      <Suspense fallback={<CollectionsGridSkeleton />}>
        <CollectionsGrid />
      </Suspense>
    </div>
  );
}
