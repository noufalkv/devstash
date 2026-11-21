import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { AiAccessHydrator, AiAccessProvider } from "@/components/items/ai-access-provider";
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
import { canUseProFeature, isProGatingEnabled } from "@/lib/usage-limits";

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

// Reads the plan at request time. The Suspense fallback renders the same bar, allowing uploads
// exactly when gating is off, so the bar shows at once and only free users see it change.
// The fallback hides the Upgrade link so Pro users never see it flash.
async function SessionTopBar() {
  await connection();
  const session = await auth();
  const isPro = session?.user?.isPro ?? false;
  return <TopBar canUploadFiles={canUseProFeature(isPro)} showUpgrade={Boolean(session?.user) && !isPro} />;
}

async function AiAccessLoader() {
  await connection();
  const session = await auth();
  return <AiAccessHydrator canUseAi={canUseProFeature(session?.user?.isPro ?? false)} />;
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
          <AiAccessProvider>
            <ItemDrawerProvider>
              <div className="flex min-h-full flex-1 flex-col">
                <Suspense fallback={<TopBar canUploadFiles={!isProGatingEnabled()} showUpgrade={false} />}>
                  <SessionTopBar />
                </Suspense>
                <div className="flex flex-1">
                  <Suspense fallback={<SidebarSkeleton />}>
                    <DashboardSidebar />
                  </Suspense>
                  <main className="min-w-0 flex-1 p-6">{children}</main>
                </div>
              </div>
              <Suspense fallback={null}>
                <SearchPalette />
              </Suspense>
              <Suspense fallback={null}>
                <EditorPreferencesLoader />
              </Suspense>
              <Suspense fallback={null}>
                <AiAccessLoader />
              </Suspense>
            </ItemDrawerProvider>
          </AiAccessProvider>
        </EditorPreferencesProvider>
      </CommandPaletteProvider>
    </SidebarProvider>
  );
}
