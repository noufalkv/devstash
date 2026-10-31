# Current Feature

Dashboard Collections (Real Data)

## Status

Completed

## Goals

- Replace the mock collection data in the dashboard main area with real data from the Neon database via Prisma
- Create `src/lib/db/collections.ts` with data fetching functions
- Fetch collections directly in the server component (no client fetching)
- Keep the current Recent Collections design (6 cards)
- Collection card border color derived from the most-used item type in that collection
- Show small icons for all item types present in each collection
- Update the collection stats display to use real data

## Notes

- Spec: @context/features/dashboard-collections-spec.md
- Mock data being replaced: @src/lib/mock-data.ts
- Design reference: @context/screenshots/dashboard-ui-main.png (layout and design already exist)
- Do not add the items underneath yet. That comes in a later feature.

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Dashboard UI Phase 1 (feature/dashboard-ui-phase-1): initialized shadcn/ui, added Button/Input components, created /dashboard route with TopBar (search input + New Item button, display only) and placeholder Sidebar/Main, enabled dark mode by default. Lint and build pass.
- Dashboard UI Phase 2 (feature/dashboard-ui-phase-2): built the collapsible sidebar — collapsible Types section linking to /items/TYPE with counts, collapsible Collections section split into Favorites and Recent, user avatar footer, and a drawer toggle in the TopBar (desktop collapse + mobile Sheet drawer via shadcn avatar/collapsible/sheet/separator/tooltip components and a SidebarProvider context). Also fixed a pre-existing bug where `--font-sans` in globals.css was self-referential, causing the whole app to fall back to the browser's default serif font instead of Geist. Lint and build pass.
- Dashboard UI Phase 3 (feature/dashboard-ui-phase-3): built out the dashboard main area — 4 stats cards (items, collections, favorite items, favorite collections), a Recent Collections grid (top 6 by updatedAt), a Pinned items list, and a Recent Items list (10 most recent by createdAt). Added shadcn card and badge components. Uses mock data directly, no database yet. Lint and build pass.
- Prisma + Neon PostgreSQL Setup (feature/prisma-neon-setup): set up Prisma 7 with Neon PostgreSQL, created the initial schema (including NextAuth models, indexes and cascade deletes), initial migration, and system item type seed.
- Seed Sample Data (feature/seed-data): rewrote `prisma/seed.ts` to seed the 7 system item types, a demo user (demo@devstash.io, bcryptjs-hashed password) and 5 collections with sample snippets, prompts, commands and links. The seed is idempotent: re-running deletes the demo user and recreates it, and cascades remove their data. Added `bcryptjs`.
- Dashboard Collections (feature/dashboard-collections): replaced mock collection data in the dashboard main area with real data from Neon via Prisma. Added `src/lib/db/collections.ts` (`getRecentCollections`, `getCollectionStats`). Collection cards now show a left border colored by the most-used item type and small colored icons for every type in the collection. The Collections and Favorite Collections stats use real counts. Queries are scoped to the demo user until auth exists. Added a `loading.tsx` skeleton, which `cacheComponents` requires for uncached data. Lint and build pass.
