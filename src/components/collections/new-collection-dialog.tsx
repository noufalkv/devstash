"use client";

import { FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createCollection } from "@/actions/collections";
import { FormField } from "@/components/items/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function NewCollectionForm({ onCreated }: { onCreated: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createCollection({ name, description });

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField id="new-collection-name" label="Name">
        <Input
          id="new-collection-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </FormField>

      <FormField id="new-collection-description" label="Description">
        <Textarea
          id="new-collection-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </FormField>

      <Button type="submit" disabled={isPending || name.trim() === ""}>
        {isPending ? "Creating..." : "Create collection"}
      </Button>
    </form>
  );
}

export function NewCollectionDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <FolderPlus />
        New Collection
      </Button>
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
