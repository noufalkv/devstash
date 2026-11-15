"use client";

import { FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createCollection } from "@/actions/collections";
import {
  CollectionForm,
  type CollectionFormValues,
} from "@/components/collections/collection-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function NewCollectionForm({ onCreated }: { onCreated: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(values: CollectionFormValues) {
    startTransition(async () => {
      const result = await createCollection(values);

      if (!result.success) {
        toast.error(result.error ?? "Could not create collection");
        return;
      }

      toast.success("Collection created");
      onCreated();
      router.refresh();
    });
  }

  return (
    <CollectionForm
      idPrefix="new-collection"
      isPending={isPending}
      submitLabel="Create collection"
      pendingLabel="Creating..."
      onSubmit={handleSubmit}
    />
  );
}

interface NewCollectionDialogProps {
  /** Pass with `onOpenChange` to control the dialog from outside; the built-in trigger button is then not rendered. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewCollectionDialog({
  open: controlledOpen,
  onOpenChange,
}: NewCollectionDialogProps = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setUncontrolledOpen;

  return (
    <>
      {!isControlled && (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <FolderPlus />
          New Collection
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
            <DialogDescription>
              Group related items under a name.
            </DialogDescription>
          </DialogHeader>
          <NewCollectionForm onCreated={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
