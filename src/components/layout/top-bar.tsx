"use client";

import Link from "next/link";
import { Layers, PanelLeft, Search } from "lucide-react";

import { NewCollectionDialog } from "@/components/collections/new-collection-dialog";
import { NewItemDialog } from "@/components/items/new-item-dialog";
import { useSidebar } from "@/components/layout/sidebar-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TopBar() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border px-4">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <Layers className="size-5 text-primary" />
        <span>DevStash</span>
      </Link>

      <Button
        variant="outline"
        size="icon"
        aria-label="Toggle sidebar"
        onClick={toggleSidebar}
      >
        <PanelLeft className="size-4" />
      </Button>

      <div className="relative mx-auto w-full max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search items..."
          className="pl-9"
          disabled
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <NewCollectionDialog />
        <NewItemDialog />
      </div>
    </header>
  );
}
