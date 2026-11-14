"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateItem } from "@/actions/items";
import { FormField } from "@/components/items/form-field";
import { ItemContentField } from "@/components/items/item-content-field";
import { CollectionPicker } from "@/components/items/collection-picker";
import { ItemDatesSection } from "@/components/items/item-detail-sections";
import type { ItemDetailJson } from "@/components/items/item-drawer";
import { ItemTypeIcon } from "@/components/items/item-type-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { CONTENT_TYPES, LANGUAGE_TYPES, URL_TYPES } from "@/lib/item-fields";

interface ItemEditFormProps {
  item: ItemDetailJson;
  onCancel: () => void;
  onSaved: (item: ItemDetailJson) => void;
}

function EditFormHeader({
  item,
  canSave,
  isPending,
  onSave,
  onCancel,
}: {
  item: ItemDetailJson;
  canSave: boolean;
  isPending: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <SheetHeader className="gap-4 border-b p-4 pr-12">
      <div className="flex items-center gap-3">
        <ItemTypeIcon itemType={item.itemType} size="lg" />
        <div className="min-w-0">
          <SheetTitle className="text-lg">Edit item</SheetTitle>
          <Badge variant="secondary" className="mt-1 capitalize">
            {item.itemType.name}
          </Badge>
        </div>
      </div>
      <SheetDescription className="sr-only">
        Edit details for {item.title}
      </SheetDescription>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onSave} disabled={isPending || !canSave}>
          {isPending ? "Saving..." : "Save"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </SheetHeader>
  );
}

export function ItemEditForm({ item, onCancel, onSaved }: ItemEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [content, setContent] = useState(item.content ?? "");
  const [language, setLanguage] = useState(item.language ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [tags, setTags] = useState(item.tags.join(", "));
  const [collectionIds, setCollectionIds] = useState(
    item.collections.map((collection) => collection.id),
  );

  const typeName = item.itemType.name;
  const showContent = item.contentType === "TEXT" && CONTENT_TYPES.has(typeName);
  const showLanguage = LANGUAGE_TYPES.has(typeName);
  const showUrl = URL_TYPES.has(typeName);

  function handleSave() {
    startTransition(async () => {
      const result = await updateItem(item.id, {
        title,
        description,
        // Fields hidden for this type keep their stored values
        content: showContent ? content : item.content,
        language: showLanguage ? language : item.language,
        url: showUrl ? url : item.url,
        tags: tags.split(","),
        collectionIds,
      });

      if (!result.success || !result.data) {
        toast.error(result.error ?? "Could not save changes");
        return;
      }

      toast.success("Item saved");
      onSaved({
        ...result.data,
        createdAt: result.data.createdAt.toISOString(),
        updatedAt: result.data.updatedAt.toISOString(),
      });
      router.refresh();
    });
  }

  return (
    <>
      <EditFormHeader
        item={item}
        canSave={title.trim() !== ""}
        isPending={isPending}
        onSave={handleSave}
        onCancel={onCancel}
      />

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        <FormField id="item-title" label="Title">
          <Input
            id="item-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </FormField>

        <FormField id="item-description" label="Description">
          <Textarea
            id="item-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </FormField>

        {showContent && (
          <FormField id="item-content" label="Content">
            <ItemContentField
              id="item-content"
              typeName={typeName}
              value={content}
              onChange={setContent}
              language={language}
              textareaClassName="min-h-40"
            />
          </FormField>
        )}

        {showLanguage && (
          <FormField id="item-language" label="Language">
            <Input
              id="item-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            />
          </FormField>
        )}

        {showUrl && (
          <FormField id="item-url" label="URL">
            <Input
              id="item-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </FormField>
        )}

        <FormField id="item-tags" label="Tags (comma-separated)">
          <Input
            id="item-tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </FormField>

        <FormField id="item-collections" label="Collections">
          <CollectionPicker
            id="item-collections"
            value={collectionIds}
            onChange={setCollectionIds}
            disabled={isPending}
          />
        </FormField>

        <ItemDatesSection createdAt={item.createdAt} updatedAt={item.updatedAt} />
      </div>
    </>
  );
}
