"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createItem } from "@/actions/items";
import { CollectionPicker } from "@/components/items/collection-picker";
import { FileUpload } from "@/components/items/file-upload";
import { FormField } from "@/components/items/form-field";
import { ItemContentField } from "@/components/items/item-content-field";
import { LanguageSelect } from "@/components/items/language-select";
import { Badge } from "@/components/ui/badge";
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
import { DEFAULT_CODE_LANGUAGE } from "@/lib/code-language";
import { isFileItemType } from "@/lib/file-upload";
import type { ItemFileData } from "@/lib/db/items";

function ItemTypePicker({
  value,
  onChange,
  disabled,
  canUploadFiles,
}: {
  value: CreatableItemType;
  onChange: (type: CreatableItemType) => void;
  disabled: boolean;
  canUploadFiles: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Type">
        {CREATABLE_ITEM_TYPES.map((name) => {
          const locked = !canUploadFiles && isFileItemType(name);
          return (
            <Button
              key={name}
              type="button"
              size="sm"
              variant={value === name ? "default" : "outline"}
              aria-pressed={value === name}
              className="capitalize"
              disabled={disabled || locked}
              onClick={() => onChange(name)}
            >
              {name}
              {locked && (
                <Badge variant="outline" className="px-1 text-[10px] uppercase">
                  Pro
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
      {!canUploadFiles && (
        <p className="text-sm text-muted-foreground">
          File and image uploads are part of Pro.{" "}
          <Link href="/upgrade" className="font-medium text-foreground underline underline-offset-4">
            Upgrade
          </Link>
        </p>
      )}
    </div>
  );
}

function NewItemForm({
  onCreated,
  defaultType,
  canUploadFiles,
}: {
  onCreated: () => void;
  defaultType?: CreatableItemType;
  canUploadFiles: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<CreatableItemType>(() =>
    defaultType && (canUploadFiles || !isFileItemType(defaultType)) ? defaultType : "snippet",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState(DEFAULT_CODE_LANGUAGE);
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
        canUploadFiles={canUploadFiles}
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

      {showLanguage && (
        <FormField id="new-item-language" label="Language">
          <LanguageSelect
            id="new-item-language"
            value={language}
            onChange={setLanguage}
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

interface NewItemDialogProps {
  defaultType?: CreatableItemType;
  label?: string;
  /** False for free users when ENFORCE_PRO_LIMITS is on: File and Image are disabled with an Upgrade link. */
  canUploadFiles?: boolean;
  /** Pass with `onOpenChange` to control the dialog from outside; the built-in trigger button is then not rendered. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewItemDialog({
  defaultType,
  label = "New Item",
  canUploadFiles = true,
  open: controlledOpen,
  onOpenChange,
}: NewItemDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setUncontrolledOpen;

  return (
    <>
      {!isControlled && (
        <Button onClick={() => setOpen(true)}>
          <Plus />
          {label}
        </Button>
      )}
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
            canUploadFiles={canUploadFiles}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
