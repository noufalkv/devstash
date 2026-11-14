"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateCollection } from "@/actions/collections";
import {
  CollectionForm,
  type CollectionFormValues,
} from "@/components/collections/collection-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface CollectionMeta {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
}

export interface CollectionDialogProps {
  collection: CollectionMeta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditCollectionForm({
  collection,
  onSaved,
}: {
  collection: CollectionMeta;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(values: CollectionFormValues) {
    startTransition(async () => {
      const result = await updateCollection(collection.id, values);

      if (!result.success) {
        toast.error(result.error ?? "Could not update collection");
        return;
      }

      toast.success("Collection updated");
      onSaved();
      router.refresh();
    });
  }

  return (
    <CollectionForm
      idPrefix={`edit-collection-${collection.id}`}
      initialValues={{
        name: collection.name,
        description: collection.description ?? "",
      }}
      isPending={isPending}
      submitLabel="Save changes"
      pendingLabel="Saving..."
      onSubmit={handleSubmit}
    />
  );
}

export function EditCollectionDialog({
  collection,
  open,
  onOpenChange,
}: CollectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit collection</DialogTitle>
          <DialogDescription>Change the name or description.</DialogDescription>
        </DialogHeader>
        <EditCollectionForm
          collection={collection}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
