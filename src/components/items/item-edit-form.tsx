"use client";

import { Calendar, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateItem } from "@/actions/items";
import type { ItemDetailJson } from "@/components/items/item-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTENT_TYPES,
  LANGUAGE_TYPES,
  URL_TYPES,
} from "@/lib/item-fields";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

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

export function ItemEditForm({
  item,
  onCancel,
  onSaved,
}: {
  item: ItemDetailJson;
  onCancel: () => void;
  onSaved: (item: ItemDetailJson) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [content, setContent] = useState(item.content ?? "");
  const [language, setLanguage] = useState(item.language ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [tags, setTags] = useState(item.tags.join(", "));

  const typeName = item.itemType.name;
  const showContent = item.contentType === "TEXT" && CONTENT_TYPES.has(typeName);
  const showLanguage = LANGUAGE_TYPES.has(typeName);
  const showUrl = URL_TYPES.has(typeName);

  const { color } = item.itemType;
  const Icon = ITEM_TYPE_ICONS[item.itemType.icon];

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
      <SheetHeader className="gap-4 border-b p-4 pr-12">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
            }}
          >
            {Icon && <Icon className="size-5" style={{ color }} />}
          </div>
          <div className="min-w-0">
            <SheetTitle className="text-lg">Edit item</SheetTitle>
            <Badge variant="secondary" className="mt-1 capitalize">
              {typeName}
            </Badge>
          </div>
        </div>
        <SheetDescription className="sr-only">
          Edit details for {item.title}
        </SheetDescription>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending || title.trim() === ""}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        <Field id="item-title" label="Title">
          <Input
            id="item-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </Field>

        <Field id="item-description" label="Description">
          <Textarea
            id="item-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        {showContent && (
          <Field id="item-content" label="Content">
            <Textarea
              id="item-content"
              className="min-h-40 font-mono text-xs"
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </Field>
        )}

        {showLanguage && (
          <Field id="item-language" label="Language">
            <Input
              id="item-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            />
          </Field>
        )}

        {showUrl && (
          <Field id="item-url" label="URL">
            <Input
              id="item-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </Field>
        )}

        <Field id="item-tags" label="Tags (comma-separated)">
          <Input
            id="item-tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </Field>

        {item.collections.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FolderOpen className="size-4" />
              Collections
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {item.collections.map((collection) => (
                <Badge key={collection.id} variant="outline">
                  {collection.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar className="size-4" />
            Details
          </h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
            <dt className="text-muted-foreground">Created</dt>
            <dd className="text-right">
              {dateFormatter.format(new Date(item.createdAt))}
            </dd>
            <dt className="text-muted-foreground">Updated</dt>
            <dd className="text-right">
              {dateFormatter.format(new Date(item.updatedAt))}
            </dd>
          </dl>
        </section>
      </div>
    </>
  );
}
