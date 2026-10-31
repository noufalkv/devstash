# Current Feature

Seed Sample Data

## Status

In Progress

## Goals

- Rewrite `prisma/seed.ts` to populate the dev database with sample data for development and demos
- Create a demo user (demo@devstash.io / Demo User, password hashed with bcryptjs at 12 rounds, not Pro, email verified)
- Seed the 7 system item types (snippet, prompt, command, note, file, image, link) with `isSystem: true`
- Create 5 collections for the demo user with their items:
  - React Patterns — 3 TypeScript snippets (custom hooks, component patterns, utility functions)
  - AI Workflows — 3 prompts (code review, documentation generation, refactoring)
  - DevOps — 1 snippet (Docker/CI), 1 command (deployment), 2 links (real docs URLs)
  - Terminal Commands — 4 commands (git, docker, process management, package manager)
  - Design Resources — 4 links (CSS/Tailwind, component library, design system, icon library — real URLs)
- Make the seed idempotent so it can be re-run safely

## Notes

- Spec: @context/features/seed-spec.md
- Schema: @prisma/schema.prisma
- Run with `npm run db:seed` (Node 22 — `nvm use` first)
- Adds `bcryptjs` as a dependency for password hashing
- Re-running deletes and recreates the demo user; cascades remove their items, collections and joins

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Dashboard UI Phase 1 (feature/dashboard-ui-phase-1): initialized shadcn/ui, added Button/Input components, created /dashboard route with TopBar (search input + New Item button, display only) and placeholder Sidebar/Main, enabled dark mode by default. Lint and build pass.
- Dashboard UI Phase 2 (feature/dashboard-ui-phase-2): built the collapsible sidebar — collapsible Types section linking to /items/TYPE with counts, collapsible Collections section split into Favorites and Recent, user avatar footer, and a drawer toggle in the TopBar (desktop collapse + mobile Sheet drawer via shadcn avatar/collapsible/sheet/separator/tooltip components and a SidebarProvider context). Also fixed a pre-existing bug where `--font-sans` in globals.css was self-referential, causing the whole app to fall back to the browser's default serif font instead of Geist. Lint and build pass.
- Dashboard UI Phase 3 (feature/dashboard-ui-phase-3): built out the dashboard main area — 4 stats cards (items, collections, favorite items, favorite collections), a Recent Collections grid (top 6 by updatedAt), a Pinned items list, and a Recent Items list (10 most recent by createdAt). Added shadcn card and badge components. Uses mock data directly, no database yet. Lint and build pass.
- Prisma + Neon PostgreSQL Setup (feature/prisma-neon-setup): set up Prisma 7 with Neon PostgreSQL, created the initial schema (including NextAuth models, indexes and cascade deletes), initial migration, and system item type seed.
