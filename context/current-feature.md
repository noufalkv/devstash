# Current Feature

Prisma + Neon PostgreSQL Setup

## Status

In Progress

## Goals

- Set up Prisma ORM (Prisma 7) with Neon PostgreSQL (serverless)
- Create the initial schema based on the data models in @context/project-overview.md (this will evolve)
- Include the NextAuth models (Account, Session, VerificationToken)
- Add appropriate indexes and cascade deletes
- Create the initial migration with `prisma migrate dev` (never `db push`)

## Notes

- Spec: @context/features/database-spec.md
- Prisma 7 has breaking changes. Read the full upgrade guide before implementing: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
- Setup guide reference: https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres
- Development branch of the Neon database lives in `DATABASE_URL`; a separate production branch will exist. ALWAYS create migrations and never push directly unless specified.
- Run `prisma migrate status` before committing to verify migrations are in sync.

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Dashboard UI Phase 1 (feature/dashboard-ui-phase-1): initialized shadcn/ui, added Button/Input components, created /dashboard route with TopBar (search input + New Item button, display only) and placeholder Sidebar/Main, enabled dark mode by default. Lint and build pass.
- Dashboard UI Phase 2 (feature/dashboard-ui-phase-2): built the collapsible sidebar — collapsible Types section linking to /items/TYPE with counts, collapsible Collections section split into Favorites and Recent, user avatar footer, and a drawer toggle in the TopBar (desktop collapse + mobile Sheet drawer via shadcn avatar/collapsible/sheet/separator/tooltip components and a SidebarProvider context). Also fixed a pre-existing bug where `--font-sans` in globals.css was self-referential, causing the whole app to fall back to the browser's default serif font instead of Geist. Lint and build pass.
- Dashboard UI Phase 3 (feature/dashboard-ui-phase-3): built out the dashboard main area — 4 stats cards (items, collections, favorite items, favorite collections), a Recent Collections grid (top 6 by updatedAt), a Pinned items list, and a Recent Items list (10 most recent by createdAt). Added shadcn card and badge components. Uses mock data directly, no database yet. Lint and build pass.
