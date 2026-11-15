"use client";

import Link from "next/link";
import { Layers } from "lucide-react";

import { SidebarNav, type SidebarData } from "@/components/layout/sidebar-nav";
import { useSidebar } from "@/components/layout/sidebar-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

export function Sidebar(data: SidebarData) {
  const { open, openMobile, isMobile, setOpenMobile } = useSidebar();

  return (
    <>
      <aside
        inert={!open}
        className={`hidden shrink-0 overflow-hidden border-r border-border transition-[width] duration-200 md:block ${
          open ? "w-64" : "w-0"
        }`}
      >
        <div className="h-full w-64">
          <SidebarNav {...data} />
        </div>
      </aside>

      <Sheet open={isMobile && openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="w-64 gap-0 p-0 md:hidden">
          {/* pr-12 keeps the logo clear of the Sheet's absolute Close button */}
          <div className="flex h-14 shrink-0 items-center border-b border-border pr-12 pl-4">
            <Link
              href="/dashboard"
              onClick={() => setOpenMobile(false)}
              className="flex items-center gap-2 font-semibold"
            >
              <Layers className="size-5 text-primary" />
              <span>DevStash</span>
            </Link>
          </div>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Browse item types and collections
          </SheetDescription>
          <div className="min-h-0 flex-1">
            <SidebarNav {...data} onNavigate={() => setOpenMobile(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
