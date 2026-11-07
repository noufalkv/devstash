"use client";

import {
  Calendar,
  Copy,
  FolderOpen,
  Pencil,
  Pin,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ItemDetail } from "@/lib/db/items";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";

export type ItemDetailJson = Omit<ItemDetail, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type DrawerState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; item: ItemDetailJson };

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getCopyText(item: ItemDetailJson): string | null {
  return item.contentType === "URL" ? item.url : item.content;
}

function ActionButton({
  icon: Icon,
  label,
  className,
  iconClassName,
  onClick,
}: {
  icon: typeof Star;
  label: string;
  className?: string;
  iconClassName?: string;
  onClick?: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={onClick}
    >
      <Icon className={iconClassName} />
      {label}
    </Button>
  );
}

function DrawerSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-muted" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-48 rounded-md bg-muted" />
          <div className="h-4 w-24 rounded-md bg-muted" />
        </div>
      </div>
      <div className="h-8 w-full rounded-md bg-muted" />
      <div className="h-4 w-2/3 rounded-md bg-muted" />
      <div className="h-40 w-full rounded-lg bg-muted" />
      <div className="h-4 w-1/3 rounded-md bg-muted" />
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon?: typeof Tag;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      {Icon && <Icon className="size-4" />}
      {children}
    </h3>
  );
}

function ItemDetailView({ item }: { item: ItemDetailJson }) {
  const { color } = item.itemType;
  const Icon = ITEM_TYPE_ICONS[item.itemType.icon];
  const copyText = getCopyText(item);

  async function handleCopy() {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
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
            <SheetTitle className="truncate text-lg">{item.title}</SheetTitle>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="capitalize">
                {item.itemType.name}
              </Badge>
              {item.language && <Badge variant="outline">{item.language}</Badge>}
            </div>
          </div>
        </div>
        <SheetDescription className="sr-only">
          Details for {item.title}
        </SheetDescription>

        <div className="flex items-center gap-1">
          <ActionButton
            icon={Star}
            label="Favorite"
            className={cn(item.isFavorite && "text-yellow-400")}
            iconClassName={cn(item.isFavorite && "fill-yellow-400")}
          />
          <ActionButton
            icon={Pin}
            label="Pin"
            className={cn(item.isPinned && "text-foreground")}
            iconClassName={cn(item.isPinned && "fill-current")}
          />
          {copyText && (
            <ActionButton icon={Copy} label="Copy" onClick={handleCopy} />
          )}
          <div className="ml-auto flex items-center gap-1">
            <ActionButton icon={Pencil} label="Edit" />
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive"
              aria-label="Delete"
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        {item.description && (
          <section className="flex flex-col gap-2">
            <SectionLabel>Description</SectionLabel>
            <p>{item.description}</p>
          </section>
        )}

        {item.contentType === "TEXT" && item.content && (
          <section className="flex flex-col gap-2">
            <SectionLabel>Content</SectionLabel>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed whitespace-pre">
              {item.content}
            </pre>
          </section>
        )}

        {item.contentType === "URL" && item.url && (
          <section className="flex flex-col gap-2">
            <SectionLabel>URL</SectionLabel>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-primary underline-offset-4 hover:underline"
            >
              {item.url}
            </a>
          </section>
        )}

        {item.contentType === "FILE" && item.fileName && (
          <section className="flex flex-col gap-2">
            <SectionLabel>File</SectionLabel>
            <p>
              {item.fileName}
              {item.fileSize !== null && (
                <span className="text-muted-foreground">
                  {" "}
                  ({formatFileSize(item.fileSize)})
                </span>
              )}
            </p>
          </section>
        )}

        <Separator />

        {item.tags.length > 0 && (
          <section className="flex flex-col gap-2">
            <SectionLabel icon={Tag}>Tags</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {item.collections.length > 0 && (
          <section className="flex flex-col gap-2">
            <SectionLabel icon={FolderOpen}>Collections</SectionLabel>
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
          <SectionLabel icon={Calendar}>Details</SectionLabel>
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

export function ItemDrawer({
  open,
  state,
  onOpenChange,
}: {
  open: boolean;
  state: DrawerState;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 data-[side=right]:sm:max-w-xl">
        {state.status === "ready" && <ItemDetailView item={state.item} />}
        {state.status === "loading" && (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>Loading item</SheetTitle>
              <SheetDescription>Loading item details</SheetDescription>
            </SheetHeader>
            <DrawerSkeleton />
          </>
        )}
        {state.status === "error" && (
          <SheetHeader className="p-4">
            <SheetTitle>Something went wrong</SheetTitle>
            <SheetDescription>{state.message}</SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}
