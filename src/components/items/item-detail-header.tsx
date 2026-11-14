"use client";

import { Copy, Download, Pencil, Pin, Star, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { ItemDeleteDialog } from "@/components/items/item-delete-dialog";
import type { ItemDetailJson } from "@/components/items/item-drawer";
import { ItemTypeIcon } from "@/components/items/item-type-icon";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getCopyText } from "@/lib/item-copy";
import { cn } from "@/lib/utils";

interface ItemDetailHeaderProps {
  item: ItemDetailJson;
  onEdit: () => void;
  onDeleted: () => void;
}

/** Drawer header in view mode: type icon, title, badges and the action bar. */
export function ItemDetailHeader({ item, onEdit, onDeleted }: ItemDetailHeaderProps) {
  return (
    <SheetHeader className="gap-4 border-b p-4 pr-12">
      <div className="flex items-center gap-3">
        <ItemTypeIcon itemType={item.itemType} size="lg" />
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

      <ItemActionBar item={item} onEdit={onEdit} onDeleted={onDeleted} />
    </SheetHeader>
  );
}

function ActionButton({
  icon: Icon,
  label,
  className,
  iconClassName,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
  iconClassName?: string;
  onClick?: () => void;
}) {
  return (
    <Button variant="ghost" size="sm" className={className} onClick={onClick}>
      <Icon className={iconClassName} />
      {label}
    </Button>
  );
}

function ItemActionBar({ item, onEdit, onDeleted }: ItemDetailHeaderProps) {
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
      {copyText && <ActionButton icon={Copy} label="Copy" onClick={handleCopy} />}
      {item.contentType === "FILE" && (
        <a
          href={`/api/download/${item.id}`}
          download
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <Download />
          Download
        </a>
      )}
      <div className="ml-auto flex items-center gap-1">
        <ActionButton icon={Pencil} label="Edit" onClick={onEdit} />
        <ItemDeleteDialog itemId={item.id} title={item.title} onDeleted={onDeleted} />
      </div>
    </div>
  );
}
