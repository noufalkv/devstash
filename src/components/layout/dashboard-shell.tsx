import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { ItemDrawerProvider } from "@/components/items/item-drawer-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-provider";
import { SidebarSkeleton } from "@/components/layout/sidebar-skeleton";
import { TopBar } from "@/components/layout/top-bar";
import { CommandPalette } from "@/components/search/command-palette";
import { CommandPaletteProvider } from "@/components/search/command-palette-provider";
import {
  EditorPreferencesHydrator,
  EditorPreferencesProvider,
} from "@/components/settings/editor-preferences-provider";
import { getSidebarCollections } from "@/lib/db/collections";
import { getSearchItems, getUserItemTypeCounts } from "@/lib/db/items";
import { getEditorPreferences, getSidebarUser } from "@/lib/db/users";

async function requireUserId(): Promise<string> {
  await connection();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in");
  return userId;
}

async function DashboardSidebar() {
  const userId = await requireUserId();

  const [itemTypes, collections, user] = await Promise.all([
    getUserItemTypeCounts(userId),
    getSidebarCollections(userId),
    getSidebarUser(userId),
  ]);

  return <Sidebar itemTypes={itemTypes} collections={collections} user={user} />;
}

// Loads the palette's search data once per request, so search itself needs no server calls.
async function SearchPalette() {
  const userId = await requireUserId();

  const [items, collections] = await Promise.all([
    getSearchItems(userId),
    getSidebarCollections(userId),
  ]);

  return (
    <CommandPalette
      items={items}
      collections={collections.map(({ id, name, itemCount }) => ({
        id,
        name,
        itemCount,
      }))}
    />
  );
}

async function EditorPreferencesLoader() {
  const userId = await requireUserId();
  const preferences = await getEditorPreferences(userId);
  return <EditorPreferencesHydrator preferences={preferences} />;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <CommandPaletteProvider>
        <EditorPreferencesProvider>
          <ItemDrawerProvider>
            <div className="flex min-h-full flex-1 flex-col">
              <TopBar />
              <div className="flex flex-1">
                <Suspense fallback={<SidebarSkeleton />}>
                  <DashboardSidebar />
                </Suspense>
                <main className="flex-1 p-6">{children}</main>
              </div>
            </div>
            <Suspense fallback={null}>
              <SearchPalette />
            </Suspense>
            <Suspense fallback={null}>
              <EditorPreferencesLoader />
            </Suspense>
          </ItemDrawerProvider>
        </EditorPreferencesProvider>
      </CommandPaletteProvider>
    </SidebarProvider>
  );
}
