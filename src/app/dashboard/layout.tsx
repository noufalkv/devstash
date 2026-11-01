import { Suspense } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-provider";
import { SidebarSkeleton } from "@/components/layout/sidebar-skeleton";
import { TopBar } from "@/components/layout/top-bar";
import { getSidebarCollections } from "@/lib/db/collections";
import { getSidebarItemTypes } from "@/lib/db/items";
import { getSidebarUser } from "@/lib/db/users";

async function DashboardSidebar() {
  const [itemTypes, collections, user] = await Promise.all([
    getSidebarItemTypes(),
    getSidebarCollections(),
    getSidebarUser(),
  ]);

  return <Sidebar itemTypes={itemTypes} collections={collections} user={user} />;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-full flex-1 flex-col">
        <TopBar />
        <div className="flex flex-1">
          <Suspense fallback={<SidebarSkeleton />}>
            <DashboardSidebar />
          </Suspense>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
