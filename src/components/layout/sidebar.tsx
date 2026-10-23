"use client";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useSidebar } from "@/components/layout/sidebar-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

export function Sidebar() {
  const { open, openMobile, setOpenMobile } = useSidebar();

  return (
    <>
      <aside
        className={`hidden shrink-0 overflow-hidden border-r border-border transition-[width] duration-200 md:block ${
          open ? "w-64" : "w-0"
        }`}
      >
        <div className="h-full w-64">
          <SidebarNav />
        </div>
      </aside>

      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="w-64 p-0 md:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Browse item types and collections
          </SheetDescription>
          <SidebarNav onNavigate={() => setOpenMobile(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
