"use client";

import { MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
import { useState } from "react";

import { setCollectionFavorite } from "@/actions/collections";
import { DeleteCollectionDialog } from "@/components/collections/delete-collection-dialog";
import {
  EditCollectionDialog,
  type CollectionMeta,
} from "@/components/collections/edit-collection-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";
import { cn } from "@/lib/utils";

function useCollectionFavorite(collection: CollectionMeta) {
  return useFavoriteToggle(collection.isFavorite, (isFavorite) =>
    setCollectionFavorite({ id: collection.id, isFavorite }),
  );
}

type OpenDialog = "edit" | "delete" | null;

function CollectionDialogs({
  collection,
  openDialog,
  setOpenDialog,
  redirectOnDelete,
}: {
  collection: CollectionMeta;
  openDialog: OpenDialog;
  setOpenDialog: (dialog: OpenDialog) => void;
  redirectOnDelete?: string;
}) {
  return (
    <>
      <EditCollectionDialog
        collection={collection}
        open={openDialog === "edit"}
        onOpenChange={(open) => setOpenDialog(open ? "edit" : null)}
      />
      <DeleteCollectionDialog
        collection={collection}
        open={openDialog === "delete"}
        onOpenChange={(open) => setOpenDialog(open ? "delete" : null)}
        redirectTo={redirectOnDelete}
      />
    </>
  );
}

/** Favorite, Edit and Delete buttons for the collection page header. */
export function CollectionHeaderActions({ collection }: { collection: CollectionMeta }) {
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const favorite = useCollectionFavorite(collection);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={favorite.isFavorite}
        disabled={favorite.isPending}
        onClick={favorite.toggle}
        className={cn(favorite.isFavorite && "text-yellow-400")}
      >
        <Star className={cn(favorite.isFavorite && "fill-yellow-400")} />
        {favorite.isFavorite ? "Unfavorite" : "Favorite"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setOpenDialog("edit")}>
        <Pencil />
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive"
        onClick={() => setOpenDialog("delete")}
      >
        <Trash2 />
        Delete
      </Button>

      <CollectionDialogs
        collection={collection}
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
        redirectOnDelete="/collections"
      />
    </div>
  );
}

/** 3-dots menu on a collection card with Favorite, Edit and Delete. */
export function CollectionCardMenu({
  collection,
  className,
}: {
  collection: CollectionMeta;
  className?: string;
}) {
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const favorite = useCollectionFavorite(collection);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className={className}
              aria-label={`Actions for ${collection.name}`}
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem disabled={favorite.isPending} onClick={favorite.toggle}>
            <Star
              className={cn(
                favorite.isFavorite && "fill-yellow-400 text-yellow-400",
              )}
            />
            {favorite.isFavorite ? "Unfavorite" : "Favorite"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDialog("edit")}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setOpenDialog("delete")}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CollectionDialogs
        collection={collection}
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
      />
    </>
  );
}
