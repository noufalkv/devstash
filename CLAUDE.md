# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.


## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

```bash
npm run dev     # start dev server (Turbopack, http://localhost:3000)
npm run build   # production build
npm run start   # run production build
npm run lint    # eslint (flat config, eslint.config.mjs)
npm test        # vitest run (unit tests, once)
npm run test:watch     # vitest in watch mode
npm run test:coverage  # vitest run with v8 coverage (src/actions and src/lib)
```

### Database (Prisma 7 + Neon)

Requires Node 22 — run `nvm use` first (see `.nvmrc`). Each script has a direct `npx` equivalent.

```bash
npm run db:generate                     # npx prisma generate — regenerate client into src/generated/prisma (also runs on postinstall)
npm run db:migrate -- --name <name>     # npx prisma migrate dev --name <name> — create + apply migration (dev branch)
npm run db:migrate:deploy               # npx prisma migrate deploy — apply migrations in production
npm run db:migrate:status               # npx prisma migrate status — verify migrations are in sync (run before committing)
npm run db:seed                         # npx prisma db seed — seed system item types, demo user, collections and items (prisma/seed.ts; deletes and recreates the demo user)
npm run db:studio                       # npx prisma studio — browse data in a GUI
npm run db:test                         # npx tsx scripts/test-db.ts — check connection, migrations, seed data, CRUD (rolled back)
npm run db:push                         # intentionally fails — never use `prisma db push`, always migrate
```

- Connection URLs live in `.env` (see `.env.example`): `DATABASE_URL` (pooled, app runtime) and `DIRECT_URL` (direct, Prisma CLI/migrations), configured in `prisma.config.ts`.
- `migrate dev` does not run `generate` or the seed in Prisma 7 — run them explicitly.
- Import the client from `@/lib/prisma`.

### Neon MCP

When using any Neon MCP tool (`run_sql`, `get_database_tables`, `describe_table_schema`, `prepare_database_migration`, etc.):

- **Project:** always use the `Devstash` project (`project_id: nameless-thunder-82960607`).
- **Branch:** always use the `develop` branch (`branch_id: br-green-voice-axlr1mye`). Pass `branch_id` explicitly on every call. Never rely on the default, because the default branch is `production`.
- **Never touch production** (`br-gentle-bird-ax2a2nkc`) unless I explicitly ask for it in that message. This covers reads, writes, schema changes, resets, restores and deletions. Approval for production in one request does not carry over to the next.
- Ask before running any destructive SQL or tool (DELETE, DROP, TRUNCATE, `reset_from_parent`, `restore_snapshot`, branch or project deletion), even on `develop`.
- Schema changes go through Prisma migrations (`npm run db:migrate`), not the MCP. Use the MCP for reading and inspecting data.
- If a task seems to need production, or you can't tell which branch a call will hit, stop and ask.

## Testing

Vitest (node environment, config in `vitest.config.ts`, `@/*` alias via `vite-tsconfig-paths`). Only server actions (`src/actions`) and utilities (`src/lib`) are unit tested; do not test components. Tests live next to the source as `*.test.ts`. Mock Prisma, `@/auth`, email and rate-limit modules with `vi.mock` + `vi.hoisted`; tests never touch the database. `next-auth` is mocked in action tests because its entry imports `next/server`, which doesn't resolve under Vitest.

## Architecture

Next.js 16 App Router. Next.js 16 has breaking changes from older versions, so read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code (see `AGENTS.md`).

- **Rendering:** `next.config.ts` enables `cacheComponents`. Uncached database reads must sit inside a `Suspense` boundary or under a route `loading.tsx`, or the build fails. See `src/app/dashboard/layout.tsx` (sidebar in `Suspense` with `SidebarSkeleton`) and `src/app/dashboard/loading.tsx`.
- **Data layer:** server components call query functions in `src/lib/db/*.ts` (`items.ts`, `collections.ts`, `users.ts`) directly. These functions return plain typed summaries (interfaces exported next to them), not Prisma models. Server Actions live in `src/actions` (auth, profile); API routes are `/api/auth/*` and `GET /api/items/[id]` (used by the item drawer).
- **Per-user data:** every query function in `src/lib/db/*.ts` takes the signed-in user's `userId`, which pages and layouts read from `auth()` (`session.user.id`). `/dashboard`, `/items` and `/profile` are protected in `src/proxy.ts`, and `GET /api/items/[id]` returns 401 when signed out. The seeded demo account (`DEMO_USER_EMAIL` in `src/lib/db/demo-user.ts`) is just a login with sample data; `deleteAccount` uses the constant to block deleting it.
- **Prisma client:** generated into `src/generated/prisma` (gitignored; import types from `@/generated/prisma/client`). `src/lib/prisma.ts` builds a singleton with the `@prisma/adapter-pg` driver adapter on `DATABASE_URL`.
- **Item types:** system types are rows with `isSystem = true` and `userId = NULL`. The `icon` column stores a Lucide icon name, which `ITEM_TYPE_ICONS` in `src/lib/item-type-icons.ts` maps to a component. Type colors come from the database `color` column. Postgres treats NULLs as distinct, so `@@unique([name, userId])` doesn't prevent duplicate system types; check for an existing row first, as `prisma/seed.ts` does.
- **Layout:** `/dashboard` is the only real route (`src/app/page.tsx` is a placeholder). The client-side `SidebarProvider` (`src/components/layout/sidebar-provider.tsx`) holds the desktop collapse state and the mobile Sheet drawer state, and `TopBar` toggles them.
- **UI:** shadcn/ui components live in `src/components/ui/` (configured in `components.json`, built on `@base-ui/react`). Feature components go in `src/components/<feature>/` with kebab-case filenames.
- **Styling:** Tailwind v4 is configured in CSS (`src/app/globals.css`, using `@theme`). There is no `tailwind.config.*`. The app is dark mode by default.
- `src/lib/mock-data.ts` is no longer imported anywhere.
- Path alias `@/*` → `./src/*` (configured in `tsconfig.json`).
- `tsconfig.json` has `strict: true` — keep new code strict-mode clean.
- ESLint uses the flat-config format (`eslint.config.mjs`) extending `eslint-config-next`'s `core-web-vitals` and `typescript` rule sets.
