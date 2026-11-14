import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { FileRow } from "@/components/items/file-row";
import { ImageCard } from "@/components/items/image-card";
import { ItemCard } from "@/components/items/item-card";
import { NewItemDialog } from "@/components/items/new-item-dialog";
import { Pagination } from "@/components/shared/pagination";
import { getItemsByType, SYSTEM_TYPE_ORDER } from "@/lib/db/items";
import {
  getPageCount,
  getPageHref,
  ITEMS_PER_PAGE,
  parsePage,
} from "@/lib/pagination";
import { CREATABLE_ITEM_TYPES, type CreatableItemType } from "@/lib/item-fields";

function toCreatableType(typeName: string): CreatableItemType | undefined {
  return CREATABLE_ITEM_TYPES.find((type) => type === typeName);
}

const TYPE_BY_SLUG = new Map(SYSTEM_TYPE_ORDER.map((name) => [`${name}s`, name]));

export function generateStaticParams() {
  return Array.from(TYPE_BY_SLUG.keys(), (type) => ({ type }));
}

interface ItemsGridProps {
  typeName: string;
  title: string;
  pathname: string;
  searchParams: PageProps<"/items/[type]">["searchParams"];
}

async function ItemsGrid({ typeName, title, pathname, searchParams }: ItemsGridProps) {
  // Reads the current time via auth(), so render at request time, not prerender
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const page = parsePage((await searchParams).page);
  const { rows: items, total } = await getItemsByType(session.user.id, typeName, {
    page,
    perPage: ITEMS_PER_PAGE,
  });

  const pageCount = getPageCount(total, ITEMS_PER_PAGE);
  if (page > pageCount) redirect(getPageHref(pathname, pageCount));

  return (
    <>
      <p className="text-muted-foreground">
        {total} {total === 1 ? "item" : "items"}
      </p>

      {items.length > 0 && typeName === "file" ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <FileRow key={item.id} item={item} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) =>
            typeName === "image" ? (
              <ImageCard key={item.id} item={item} />
            ) : (
              <ItemCard key={item.id} item={item} />
            ),
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No {title.toLowerCase()} yet.
        </p>
      )}

      <Pagination pathname={pathname} page={page} pageCount={pageCount} />
    </>
  );
}

function ItemsGridSkeleton({ typeName }: { typeName: string }) {
  const isImages = typeName === "image";

  if (typeName === "file") {
    return (
      <div className="flex animate-pulse flex-col gap-6">
        <div className="h-5 w-24 rounded-md bg-muted" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="h-5 w-24 rounded-md bg-muted" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className={
              isImages ? "aspect-video rounded-xl bg-muted" : "h-24 rounded-xl bg-muted"
            }
          />
        ))}
      </div>
    </div>
  );
}

export default async function ItemsByTypePage({
  params,
  searchParams,
}: PageProps<"/items/[type]">) {
  const { type } = await params;
  const typeName = TYPE_BY_SLUG.get(type);

  if (!typeName) {
    notFound();
  }

  const creatableType = toCreatableType(typeName);
  const title = `${typeName.charAt(0).toUpperCase()}${typeName.slice(1)}s`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">{title}</h1>
        {creatableType && (
          <NewItemDialog
            defaultType={creatableType}
            label={`Add ${typeName}`}
          />
        )}
      </div>
      <Suspense fallback={<ItemsGridSkeleton typeName={typeName} />}>
        <ItemsGrid
          typeName={typeName}
          title={title}
          pathname={`/items/${type}`}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}
