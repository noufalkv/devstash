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

There is no test runner configured yet — no test script, framework, or test files exist in the repo.

## Architecture

This is an App Router project in its initial scaffolded state (bootstrapped from `create-next-app`, now being customized — see git status for in-progress removal of the default public assets).

- `src/app/layout.tsx` — root layout; loads Geist Sans/Mono via `next/font/google` and exposes them as CSS variables (`--font-geist-sans`, `--font-geist-mono`).
- `src/app/page.tsx` — home route.
- `src/app/globals.css` — single Tailwind v4 import; no separate Tailwind config file.
- Path alias `@/*` → `./src/*` (configured in `tsconfig.json`).
- `tsconfig.json` has `strict: true` — keep new code strict-mode clean.
- ESLint uses the flat-config format (`eslint.config.mjs`) extending `eslint-config-next`'s `core-web-vitals` and `typescript` rule sets.
