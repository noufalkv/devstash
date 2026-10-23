"use client";

import { Layers, PanelLeft, Plus, Search } from "lucide-react";

import { useSidebar } from "@/components/layout/sidebar-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TopBar() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border px-4">
      <div className="flex items-center gap-2 font-semibold">
        <Layers className="size-5 text-primary" />
        <span>DevStash</span>
      </div>

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

      <Button disabled>
        <Plus />
        New Item
      </Button>
    </header>
  );
}
