# Current Feature

## Status

Not Started

## Goals

<!-- Goals go here -->

## Notes

<!-- Notes go here -->

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
- Add Pro Badge to Sidebar (feature/add-pro-badge-sidebar): added a subtle outline shadcn `Badge` reading "PRO" next to the Files and Images types in the sidebar (`src/components/layout/sidebar-nav.tsx`, driven by a `PRO_TYPES` set). Lint and build pass.
- Code Review Quick Wins (fix/code-review-quick-wins): fixed the low-risk issues from a full codebase review. The mobile `Sheet` now only opens at mobile width (`isMobile && openMobile`), so a stale backdrop no longer blocks the desktop layout after a resize. The collapsed desktop sidebar is `inert`, so its hidden links leave the tab order. `getPinnedItems` takes a `limit` (default 10). Item icon backgrounds use `color-mix` instead of a hex alpha suffix, so any CSS color works. Bigger review items (sidebar collections over-fetching, splitting `SidebarNav`, composite indexes, inline color styles) are deferred. Lint and build pass.
- Auth Setup (feature/auth-setup): set up NextAuth v5 (`next-auth@beta`) with the Prisma adapter and GitHub OAuth, using the split config pattern. `src/auth.config.ts` holds the edge-safe provider config, `src/auth.ts` adds the adapter, JWT sessions and a session callback that exposes `user.id`, and `src/app/api/auth/[...nextauth]/route.ts` exports the handlers. `src/proxy.ts` protects `/dashboard/*` and redirects unauthenticated users to NextAuth's default sign-in page. `src/types/next-auth.d.ts` extends the Session type. Added `AUTH_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` to `.env.example`. Queries still use the demo user until a later phase. Lint and build pass.
