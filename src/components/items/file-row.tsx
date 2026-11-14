"use client";

import {
  Download,
  File,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileText,
  Pin,
  Star,
  type LucideIcon,
} from "lucide-react";

import { useItemDrawer } from "@/components/items/item-drawer-provider";
import { Button } from "@/components/ui/button";
import type { ItemSummary } from "@/lib/db/items";
import {
  formatFileSize,
  getFileIconKind,
  type FileIconKind,
} from "@/lib/file-upload";
import { formatDate } from "@/lib/format-date";

const FILE_ICONS: Record<FileIconKind, LucideIcon> = {
  pdf: FileText,
  json: FileJson,
  spreadsheet: FileSpreadsheet,
  markup: FileCode,
  text: FileText,
  generic: File,
};

export function FileRow({ item }: { item: ItemSummary }) {
  const { openItem } = useItemDrawer();
  const name = item.fileName ?? item.title;
  const Icon = FILE_ICONS[getFileIconKind(item.fileName)];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openItem(item.id)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openItem(item.id);
        }
      }}
      className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-3 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <p className="truncate text-sm font-medium">{name}</p>
          {item.isPinned && (
            <Pin className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          {item.isFavorite && (
            <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground sm:gap-6">
          <span className="sm:w-20 sm:text-right">
            {item.fileSize === null ? "—" : formatFileSize(item.fileSize)}
          </span>
          <span className="sm:w-28 sm:text-right">
            {formatDate(item.createdAt, "medium")}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        nativeButton={false}
        render={
          <a
            href={`/api/download/${item.id}`}
            download
            aria-label={`Download ${name}`}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          />
        }
      >
        <Download className="size-4" />
      </Button>
    </div>
  );
}
