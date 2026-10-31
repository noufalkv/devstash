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
npm run db:seed                         # npx prisma db seed — seed system item types (prisma/seed.ts)
npm run db:studio                       # npx prisma studio — browse data in a GUI
npm run db:test                         # npx tsx scripts/test-db.ts — check connection, migrations, seed data, CRUD (rolled back)
npm run db:push                         # intentionally fails — never use `prisma db push`, always migrate
```

- Connection URLs live in `.env` (see `.env.example`): `DATABASE_URL` (pooled, app runtime) and `DIRECT_URL` (direct, Prisma CLI/migrations), configured in `prisma.config.ts`.
- `migrate dev` does not run `generate` or the seed in Prisma 7 — run them explicitly.
- Import the client from `@/lib/prisma`.

There is no test runner configured yet — no test script, framework, or test files exist in the repo.

## Architecture

This is an App Router project in its initial scaffolded state (bootstrapped from `create-next-app`, now being customized — see git status for in-progress removal of the default public assets).

- `src/app/layout.tsx` — root layout; loads Geist Sans/Mono via `next/font/google` and exposes them as CSS variables (`--font-geist-sans`, `--font-geist-mono`).
- `src/app/page.tsx` — home route.
- `src/app/globals.css` — single Tailwind v4 import; no separate Tailwind config file.
- Path alias `@/*` → `./src/*` (configured in `tsconfig.json`).
- `tsconfig.json` has `strict: true` — keep new code strict-mode clean.
- ESLint uses the flat-config format (`eslint.config.mjs`) extending `eslint-config-next`'s `core-web-vitals` and `typescript` rule sets.
