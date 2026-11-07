"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createItem } from "@/actions/items";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTENT_TYPES,
  CREATABLE_ITEM_TYPES,
  LANGUAGE_TYPES,
  URL_TYPES,
  type CreatableItemType,
} from "@/lib/item-fields";

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function NewItemForm({ onCreated }: { onCreated: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<CreatableItemType>("snippet");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");

  const showContent = CONTENT_TYPES.has(type);
  const showLanguage = LANGUAGE_TYPES.has(type);
  const showUrl = URL_TYPES.has(type);
  const canSubmit = title.trim() !== "" && (!showUrl || url.trim() !== "");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createItem({
        type,
        title,
        description,
        // Only send fields shown for this type, so a stale invalid URL from another type cannot block the save
        content: showContent ? content : "",
        language: showLanguage ? language : "",
        url: showUrl ? url : "",
        tags: tags.split(","),
      });

      if (!result.success) {
        toast.error(result.error ?? "Could not create item");
        return;
      }

      toast.success("Item created");
      onCreated();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Type">
        {CREATABLE_ITEM_TYPES.map((name) => (
          <Button
            key={name}
            type="button"
            size="sm"
            variant={type === name ? "default" : "outline"}
            aria-pressed={type === name}
            className="capitalize"
            disabled={isPending}
            onClick={() => setType(name)}
          >
            {name}
          </Button>
        ))}
      </div>

      <Field id="new-item-title" label="Title">
        <Input
          id="new-item-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </Field>

      <Field id="new-item-description" label="Description">
        <Textarea
          id="new-item-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>

      {showContent && (
        <Field id="new-item-content" label="Content">
          <Textarea
            id="new-item-content"
            className="min-h-32 font-mono text-xs"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </Field>
      )}

      {showLanguage && (
        <Field id="new-item-language" label="Language">
          <Input
            id="new-item-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          />
        </Field>
      )}

      {showUrl && (
        <Field id="new-item-url" label="URL">
          <Input
            id="new-item-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
          />
        </Field>
      )}

      <Field id="new-item-tags" label="Tags (comma-separated)">
        <Input
          id="new-item-tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />
      </Field>

      <Button type="submit" disabled={isPending || !canSubmit}>
        {isPending ? "Creating..." : "Create item"}
      </Button>
    </form>
  );
}

export function NewItemDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        New Item
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New item</DialogTitle>
            <DialogDescription>
              Choose a type and fill in the details.
            </DialogDescription>
          </DialogHeader>
          <NewItemForm onCreated={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
