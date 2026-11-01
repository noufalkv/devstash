"use client";

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
        <SheetContent side="left" className="w-64 p-0 md:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Browse item types and collections
          </SheetDescription>
          <SidebarNav {...data} onNavigate={() => setOpenMobile(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
