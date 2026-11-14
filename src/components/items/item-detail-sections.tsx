"use client";

import { Calendar, FolderOpen, Tag, type LucideIcon } from "lucide-react";

import { ItemContentField } from "@/components/items/item-content-field";
import type { ItemDetailJson } from "@/components/items/item-drawer";
import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/lib/file-upload";
import { formatDate } from "@/lib/format-date";

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      {Icon && <Icon className="size-4" />}
      {children}
    </h3>
  );
}

function Section({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <SectionLabel icon={icon}>{label}</SectionLabel>
      {children}
    </section>
  );
}

/** The item's main payload: text content, link URL or uploaded file. Renders nothing when there is none. */
export function ItemBodySection({ item }: { item: ItemDetailJson }) {
  if (item.contentType === "TEXT" && item.content) {
    return (
      <Section label="Content">
        <ItemContentField
          typeName={item.itemType.name}
          value={item.content}
          language={item.language}
          readOnly
        />
      </Section>
    );
  }

  if (item.contentType === "URL" && item.url) {
    return (
      <Section label="URL">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-primary underline-offset-4 hover:underline"
        >
          {item.url}
        </a>
      </Section>
    );
  }

  if (item.contentType === "FILE" && item.fileName) {
    return <ItemFileSection item={item} />;
  }

  return null;
}

function ItemFileSection({ item }: { item: ItemDetailJson }) {
  const isImage = item.itemType.name === "image";

  return (
    <Section label={isImage ? "Image" : "File"}>
      {isImage && (
        // eslint-disable-next-line @next/next/no-img-element -- served by the authenticated download proxy
        <img
          src={`/api/download/${item.id}?inline=1`}
          alt={item.title}
          className="max-h-80 w-full rounded-lg border bg-muted object-contain"
        />
      )}
      <p className="break-all">
        {item.fileName}
        {item.fileSize !== null && (
          <span className="text-muted-foreground">
            {" "}
            ({formatFileSize(item.fileSize)})
          </span>
        )}
      </p>
    </Section>
  );
}

export function ItemDescriptionSection({ description }: { description: string | null }) {
  if (!description) return null;
  return (
    <Section label="Description">
      <p>{description}</p>
    </Section>
  );
}

export function ItemTagsSection({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <Section label="Tags" icon={Tag}>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
    </Section>
  );
}

export function ItemCollectionsSection({
  collections,
}: {
  collections: ItemDetailJson["collections"];
}) {
  if (collections.length === 0) return null;
  return (
    <Section label="Collections" icon={FolderOpen}>
      <div className="flex flex-wrap gap-1.5">
        {collections.map((collection) => (
          <Badge key={collection.id} variant="outline">
            {collection.name}
          </Badge>
        ))}
      </div>
    </Section>
  );
}

export function ItemDatesSection({
  createdAt,
  updatedAt,
}: {
  createdAt: string;
  updatedAt: string;
}) {
  return (
    <Section label="Details" icon={Calendar}>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
        <dt className="text-muted-foreground">Created</dt>
        <dd className="text-right">{formatDate(createdAt, "long")}</dd>
        <dt className="text-muted-foreground">Updated</dt>
        <dd className="text-right">{formatDate(updatedAt, "long")}</dd>
      </dl>
    </Section>
  );
}
