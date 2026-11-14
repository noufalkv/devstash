"use client";

import { useState } from "react";

import { ItemDetailHeader } from "@/components/items/item-detail-header";
import {
  ItemBodySection,
  ItemCollectionsSection,
  ItemDatesSection,
  ItemDescriptionSection,
  ItemTagsSection,
} from "@/components/items/item-detail-sections";
import { ItemEditForm } from "@/components/items/item-edit-form";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ItemDetail } from "@/lib/db/items";

export type ItemDetailJson = Omit<ItemDetail, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type DrawerState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; item: ItemDetailJson };

function DrawerSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-muted" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-48 rounded-md bg-muted" />
          <div className="h-4 w-24 rounded-md bg-muted" />
        </div>
      </div>
      <div className="h-8 w-full rounded-md bg-muted" />
      <div className="h-4 w-2/3 rounded-md bg-muted" />
      <div className="h-40 w-full rounded-lg bg-muted" />
      <div className="h-4 w-1/3 rounded-md bg-muted" />
    </div>
  );
}

function ItemDetailView({
  item,
  onUpdated,
  onDeleted,
}: {
  item: ItemDetailJson;
  onUpdated: (item: ItemDetailJson) => void;
  onDeleted: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <ItemEditForm
        item={item}
        onCancel={() => setIsEditing(false)}
        onSaved={(updated) => {
          onUpdated(updated);
          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <>
      <ItemDetailHeader
        item={item}
        onEdit={() => setIsEditing(true)}
        onDeleted={onDeleted}
      />
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        <ItemDescriptionSection description={item.description} />
        <ItemBodySection item={item} />
        <Separator />
        <ItemTagsSection tags={item.tags} />
        <ItemCollectionsSection collections={item.collections} />
        <ItemDatesSection createdAt={item.createdAt} updatedAt={item.updatedAt} />
      </div>
    </>
  );
}

export function ItemDrawer({
  open,
  state,
  onOpenChange,
  onItemUpdated,
}: {
  open: boolean;
  state: DrawerState;
  onOpenChange: (open: boolean) => void;
  onItemUpdated: (item: ItemDetailJson) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 data-[side=right]:sm:max-w-xl">
        {state.status === "ready" && (
          <ItemDetailView
            item={state.item}
            onUpdated={onItemUpdated}
            onDeleted={() => onOpenChange(false)}
          />
        )}
        {state.status === "loading" && (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>Loading item</SheetTitle>
              <SheetDescription>Loading item details</SheetDescription>
            </SheetHeader>
            <DrawerSkeleton />
          </>
        )}
        {state.status === "error" && (
          <SheetHeader className="p-4">
            <SheetTitle>Something went wrong</SheetTitle>
            <SheetDescription>{state.message}</SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}
