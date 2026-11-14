"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createItem } from "@/actions/items";
import { CollectionPicker } from "@/components/items/collection-picker";
import { FileUpload } from "@/components/items/file-upload";
import { FormField } from "@/components/items/form-field";
import { ItemContentField } from "@/components/items/item-content-field";
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
import {
  CONTENT_TYPES,
  CREATABLE_ITEM_TYPES,
  LANGUAGE_TYPES,
  URL_TYPES,
  type CreatableItemType,
} from "@/lib/item-fields";
import { isFileItemType } from "@/lib/file-upload";
import type { ItemFileData } from "@/lib/db/items";

function ItemTypePicker({
  value,
  onChange,
  disabled,
}: {
  value: CreatableItemType;
  onChange: (type: CreatableItemType) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Type">
      {CREATABLE_ITEM_TYPES.map((name) => (
        <Button
          key={name}
          type="button"
          size="sm"
          variant={value === name ? "default" : "outline"}
          aria-pressed={value === name}
          className="capitalize"
          disabled={disabled}
          onClick={() => onChange(name)}
        >
          {name}
        </Button>
      ))}
    </div>
  );
}

function NewItemForm({
  onCreated,
  defaultType,
}: {
  onCreated: () => void;
  defaultType?: CreatableItemType;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<CreatableItemType>(defaultType ?? "snippet");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<ItemFileData | null>(null);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);

  const showContent = CONTENT_TYPES.has(type);
  const showLanguage = LANGUAGE_TYPES.has(type);
  const showUrl = URL_TYPES.has(type);
  const fileType = isFileItemType(type) ? type : null;
  const canSubmit =
    title.trim() !== "" &&
    (!showUrl || url.trim() !== "") &&
    (!fileType || file !== null);

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
        file: fileType ? file : null,
        tags: tags.split(","),
        collectionIds,
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
      <ItemTypePicker
        value={type}
        disabled={isPending}
        onChange={(name) => {
          setType(name);
          setFile(null);
        }}
      />

      <FormField id="new-item-title" label="Title">
        <Input
          id="new-item-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </FormField>

      <FormField id="new-item-description" label="Description">
        <Textarea
          id="new-item-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </FormField>

      {fileType && (
        <FormField label="File">
          <FileUpload
            key={fileType}
            type={fileType}
            value={file}
            onChange={setFile}
            disabled={isPending}
          />
        </FormField>
      )}

      {showContent && (
        <FormField id="new-item-content" label="Content">
          <ItemContentField
            id="new-item-content"
            typeName={type}
            value={content}
            onChange={setContent}
            language={language}
            textareaClassName="min-h-32"
          />
        </FormField>
      )}

      {showLanguage && (
        <FormField id="new-item-language" label="Language">
          <Input
            id="new-item-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          />
        </FormField>
      )}

      {showUrl && (
        <FormField id="new-item-url" label="URL">
          <Input
            id="new-item-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
          />
        </FormField>
      )}

      <FormField id="new-item-tags" label="Tags (comma-separated)">
        <Input
          id="new-item-tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />
      </FormField>

      <FormField id="new-item-collections" label="Collections">
        <CollectionPicker
          id="new-item-collections"
          value={collectionIds}
          onChange={setCollectionIds}
          disabled={isPending}
        />
      </FormField>

      <Button type="submit" disabled={isPending || !canSubmit}>
        {isPending ? "Creating..." : "Create item"}
      </Button>
    </form>
  );
}

export function NewItemDialog({
  defaultType,
  label = "New Item",
}: {
  defaultType?: CreatableItemType;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New item</DialogTitle>
            <DialogDescription>
              Choose a type and fill in the details.
            </DialogDescription>
          </DialogHeader>
          <NewItemForm
            onCreated={() => setOpen(false)}
            defaultType={defaultType}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
