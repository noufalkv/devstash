import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { ItemCard } from "@/components/items/item-card";
import { getItemsByType, SYSTEM_TYPE_ORDER } from "@/lib/db/items";

const TYPE_BY_SLUG = new Map(SYSTEM_TYPE_ORDER.map((name) => [`${name}s`, name]));

export function generateStaticParams() {
  return Array.from(TYPE_BY_SLUG.keys(), (type) => ({ type }));
}

async function ItemsGrid({ typeName, title }: { typeName: string; title: string }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const items = await getItemsByType(session.user.id, typeName);

  return (
    <>
      <p className="text-muted-foreground">
        {items.length} {items.length === 1 ? "item" : "items"}
      </p>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No {title.toLowerCase()} yet.
        </p>
      )}
    </>
  );
}

function ItemsGridSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="h-5 w-24 rounded-md bg-muted" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default async function ItemsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const typeName = TYPE_BY_SLUG.get(type);

  if (!typeName) {
    notFound();
  }

  const title = `${typeName.charAt(0).toUpperCase()}${typeName.slice(1)}s`;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <Suspense fallback={<ItemsGridSkeleton />}>
        <ItemsGrid typeName={typeName} title={title} />
      </Suspense>
    </div>
  );
}
