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

There is no test runner configured yet — no test script, framework, or test files exist in the repo.

## Architecture

Next.js 16 App Router. Next.js 16 has breaking changes from older versions, so read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code (see `AGENTS.md`).

- **Rendering:** `next.config.ts` enables `cacheComponents`. Uncached database reads must sit inside a `Suspense` boundary or under a route `loading.tsx`, or the build fails. See `src/app/dashboard/layout.tsx` (sidebar in `Suspense` with `SidebarSkeleton`) and `src/app/dashboard/loading.tsx`.
- **Data layer:** server components call query functions in `src/lib/db/*.ts` (`items.ts`, `collections.ts`, `users.ts`) directly. These functions return plain typed summaries (interfaces exported next to them), not Prisma models. There are no Server Actions or API routes yet.
- **No auth yet:** every query is scoped to the seeded demo user through `DEMO_USER_EMAIL` in `src/lib/db/demo-user.ts`. Without the seed, the dashboard is empty.
- **Prisma client:** generated into `src/generated/prisma` (gitignored; import types from `@/generated/prisma/client`). `src/lib/prisma.ts` builds a singleton with the `@prisma/adapter-pg` driver adapter on `DATABASE_URL`.
- **Item types:** system types are rows with `isSystem = true` and `userId = NULL`. The `icon` column stores a Lucide icon name, which `ITEM_TYPE_ICONS` in `src/lib/item-type-icons.ts` maps to a component. Type colors come from the database `color` column. Postgres treats NULLs as distinct, so `@@unique([name, userId])` doesn't prevent duplicate system types; check for an existing row first, as `prisma/seed.ts` does.
- **Layout:** `/dashboard` is the only real route (`src/app/page.tsx` is a placeholder). The client-side `SidebarProvider` (`src/components/layout/sidebar-provider.tsx`) holds the desktop collapse state and the mobile Sheet drawer state, and `TopBar` toggles them.
- **UI:** shadcn/ui components live in `src/components/ui/` (configured in `components.json`, built on `@base-ui/react`). Feature components go in `src/components/<feature>/` with kebab-case filenames.
- **Styling:** Tailwind v4 is configured in CSS (`src/app/globals.css`, using `@theme`). There is no `tailwind.config.*`. The app is dark mode by default.
- `src/lib/mock-data.ts` is no longer imported anywhere.
- Path alias `@/*` → `./src/*` (configured in `tsconfig.json`).
- `tsconfig.json` has `strict: true` — keep new code strict-mode clean.
- ESLint uses the flat-config format (`eslint.config.mjs`) extending `eslint-config-next`'s `core-web-vitals` and `typescript` rule sets.
