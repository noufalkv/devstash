# Homepage

## Overview

Replace the placeholder `src/app/page.tsx` with the real marketing homepage, built from the mockup in `prototypes/homepage/` (`index.html`, `styles.css`, `script.js`). Keep the same sections, copy, layout and animations, rebuilt with Tailwind v4 and shadcn/ui. The prototype stays as a reference and is not imported.

## Requirements

### Structure

- `src/app/page.tsx` is a server component that composes the sections; set real `metadata` (title "DevStash - Your Developer Knowledge Hub" and the mockup's description)
- Section components live in `src/components/homepage/` (kebab-case files), one per section: `home-nav`, `hero`, `chaos-panel`, `dashboard-preview`, `features-section`, `ai-section`, `pricing-section`, `cta-section`, `home-footer`
- Server components by default. Client components only where the mockup needs JS:
  - `HomeNav` shell: more opaque background once `scrollY > 20`
  - `ChaosPanel`: the `requestAnimationFrame` icon animation (drift, wall bounce, rotation, scale pulse, cursor repel, paused while off screen)
  - `PricingToggle`: Monthly/Yearly switch that updates the Pro price, period and note
  - `FadeIn`: a small wrapper that adds the visible state through `IntersectionObserver` (hero elements reveal on mount)
  - `AiTags`: tags pop in one by one once the editor is in view
- Keep client components small: pass static content in as props or children so the copy and markup stay in server components
- All animations respect `prefers-reduced-motion` (no movement, everything visible)

### DRY

- Put the static content (feature cards, AI checklist, pricing plans, footer links, chaos icons, preview cards) in typed constant arrays in `src/components/homepage/content.ts` and map over them
- One shared `SectionHeading` (title + subtitle) for Features and Pricing; one `Checklist` for the AI section and both price cards
- Reuse the app's logo (Lucide `Layers`, as in `TopBar`) in a shared `Logo` component used by the nav and footer
- Use Lucide icons for features, checklist and type dots instead of the mockup's inline SVGs. The chaos icons (Notion, GitHub, Slack, VS Code, etc.) can stay simple inline SVGs, defined once in `content.ts`
- Use the app's system type colors (`#3b82f6`, `#8b5cf6`, `#f97316`, `#fde047`, `#6b7280`, `#ec4899`, `#10b981`) rather than the mockup's palette, so the homepage matches the dashboard. Define them once (CSS variables in `globals.css` `@theme` or one constant); no per-element hex values scattered around

### Styling

- Tailwind utilities and shadcn `Button` (`asChild`/`render` link variants), `Badge`, `Card` and `Switch`; no new `.css` file
- Keyframes the mockup needs (arrow pulse, tag pop-in, fade-in) go in `globals.css`
- Dark theme only, like the rest of the app
- Responsive as in the mockup: hero visual stacks below `md` with the arrow rotated to point down, grids go to one column, no horizontal scroll at 320px

### Links and buttons

| Element                                         | Destination                       |
| ----------------------------------------------- | --------------------------------- |
| Logo (nav, footer)                              | `/`                               |
| Features / Pricing (nav, footer, "See Features") | `#features` / `#pricing` (smooth scroll, offset for the fixed nav) |
| Sign In                                         | `/sign-in`                        |
| Get Started, Get Started Free (hero, CTA), Free plan "Get Started" | `/register` |
| Upgrade to Pro                                  | `/register` (no Stripe yet)       |

- If the user is signed in, the nav shows a single "Dashboard" button (`/dashboard`) instead of Sign In / Get Started. Read the session with `auth()` in a small server component inside `Suspense` (fallback: the signed-out buttons), so the rest of the page stays static under `cacheComponents`
- Footer: drop the links that have no page yet (Changelog, Docs, Guides, Support, About, Privacy, Terms). Keep Product (Features, Pricing) and an Account column (Sign In, Register). No `href="#"` anywhere
- Footer year: render it without breaking prerender (a tiny client component, or a cached value); do not call `new Date()` in an uncached server component
- `/` stays public (not added to the `src/proxy.ts` matcher)

## Notes

- No server actions, queries or utilities are added, so no new unit tests unless a pure helper is extracted (e.g. the chaos physics step), in which case test it in `src/lib`
- Check in the browser: every link and button, the pricing toggle (click and keyboard), the chaos animation and cursor repel, nav opacity, scroll fade-ins, signed-in vs signed-out nav, and phone width
