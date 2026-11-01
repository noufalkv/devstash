# Current Feature

Stats & Sidebar (Real Data)

## Status

Completed

## Goals

- Display stats in the main area from database data, keeping the current design/layout
- Display the system item types in the sidebar with their icons, linking to /items/[typename]
- Display the actual collection data from the database in the sidebar
- Add a "View all collections" link under the collections list that goes to /collections
- Keep the star icons for favorite collections; for recent collections, show a colored circle based on the most-used item type in that collection
- Add the database functions to `src/lib/db/items.ts` (use `src/lib/db/collections.ts` for reference)

## Notes

- Spec: @context/features/stats-sidebar-spec.md
- Mock data being replaced: @src/lib/mock-data.ts (now only used by `src/components/layout/sidebar-nav.tsx`)
- Reference: @src/lib/db/collections.ts
- `src/lib/db/items.ts` already exists from the Dashboard Items feature — extend it rather than recreate it
- Main area stats (items, collections, favorites) already use real data from the previous two features — verify only

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Dashboard UI Phase 1 (feature/dashboard-ui-phase-1): initialized shadcn/ui, added Button/Input components, created /dashboard route with TopBar (search input + New Item button, display only) and placeholder Sidebar/Main, enabled dark mode by default. Lint and build pass.
- Dashboard UI Phase 2 (feature/dashboard-ui-phase-2): built the collapsible sidebar — collapsible Types section linking to /items/TYPE with counts, collapsible Collections section split into Favorites and Recent, user avatar footer, and a drawer toggle in the TopBar (desktop collapse + mobile Sheet drawer via shadcn avatar/collapsible/sheet/separator/tooltip components and a SidebarProvider context). Also fixed a pre-existing bug where `--font-sans` in globals.css was self-referential, causing the whole app to fall back to the browser's default serif font instead of Geist. Lint and build pass.
- Dashboard UI Phase 3 (feature/dashboard-ui-phase-3): built out the dashboard main area — 4 stats cards (items, collections, favorite items, favorite collections), a Recent Collections grid (top 6 by updatedAt), a Pinned items list, and a Recent Items list (10 most recent by createdAt). Added shadcn card and badge components. Uses mock data directly, no database yet. Lint and build pass.
- Prisma + Neon PostgreSQL Setup (feature/prisma-neon-setup): set up Prisma 7 with Neon PostgreSQL, created the initial schema (including NextAuth models, indexes and cascade deletes), initial migration, and system item type seed.
- Seed Sample Data (feature/seed-data): rewrote `prisma/seed.ts` to seed the 7 system item types, a demo user (demo@devstash.io, bcryptjs-hashed password) and 5 collections with sample snippets, prompts, commands and links. The seed is idempotent: re-running deletes the demo user and recreates it, and cascades remove their data. Added `bcryptjs`.
- Dashboard Collections (feature/dashboard-collections): replaced mock collection data in the dashboard main area with real data from Neon via Prisma. Added `src/lib/db/collections.ts` (`getRecentCollections`, `getCollectionStats`). Collection cards now show a left border colored by the most-used item type and small colored icons for every type in the collection. The Collections and Favorite Collections stats use real counts. Queries are scoped to the demo user until auth exists. Added a `loading.tsx` skeleton, which `cacheComponents` requires for uncached data. Lint and build pass.
- Dashboard Items (feature/dashboard-items): replaced mock item data in the dashboard Pinned and Recent Items sections with real data from Neon via Prisma. Added `src/lib/db/items.ts` (`getPinnedItems`, `getRecentItems`, `getItemStats`) and moved the demo user email into a shared `src/lib/db/demo-user.ts`. Item rows take their icon, icon background and left border color from the item type. The Pinned section is hidden when there are no pinned items. The Items and Favorite Items stats use real counts. Lint and build pass.
- Stats & Sidebar (feature/stats-sidebar): replaced mock data in the sidebar with real data from Neon via Prisma. Added `getSidebarItemTypes` to `src/lib/db/items.ts` (system types in a fixed order with per-type item counts), `getSidebarCollections` to `src/lib/db/collections.ts` (shares a `findCollectionSummaries` helper with `getRecentCollections`), and `src/lib/db/users.ts` (`getSidebarUser`) for the footer. The dashboard layout fetches the sidebar data on the server inside a `Suspense` boundary with a new `SidebarSkeleton`. Type labels are capitalized ("Snippets", "Prompts", …) and link to /items/[type]s. Favorite collections keep the star; recent collections show a colored circle for their most-used item type. Added a "View all collections" link to /collections. Main area stats already used real data. `src/lib/mock-data.ts` is no longer used. Lint and build pass.
