# Stripe Phase 1 - Core Infrastructure

## Overview

Lay the groundwork for DevStash Pro ($8/month or $72/year) without any Stripe network calls, webhooks or UI. This phase adds the Stripe client, the usage-limits rules, `isPro` on the session, and the billing queries in the data layer. Everything is covered by unit tests and can be verified without the Stripe CLI.

Full research and code sketches: `docs/stripe-integration-plan.md` (sections 4.2 and 4.3).

## Requirements

- Install `stripe` (v23.x, which pins its own API version)
- Add a lazy Stripe client and config helpers
- Add a usage-limits module as the single source of the free-tier rules, behind an `ENFORCE_PRO_LIMITS` flag
- Put `isPro` on the JWT and session, re-read from the database on every `auth()` call
- Add billing reads and writes to `src/lib/db/users.ts`
- No migration: `isPro`, `stripeCustomerId` and `stripeSubscriptionId` already exist on `User`

## Files to Create

1. `src/lib/stripe.ts`
   - `getStripe()`: singleton created on first use, throws `"Stripe is not configured"` when `STRIPE_SECRET_KEY` is missing (same pattern as `src/lib/r2.ts`)
   - `getPriceId(billing: "monthly" | "yearly")`: reads `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`, throws when missing
   - `getAppUrl()`: `AUTH_URL`, falling back to `http://localhost:3000`
   - Export the `Billing` type
2. `src/lib/usage-limits.ts`
   - `FREE_ITEM_LIMIT = 50`, `FREE_COLLECTION_LIMIT = 3`
   - `isProGatingEnabled()`: the only reader of `ENFORCE_PRO_LIMITS` (`=== "true"`), like `isEmailVerificationEnabled()`
   - `UsageContext` interface: `isPro`, `itemCount`, `collectionCount`
   - `getItemLimitError(ctx, type)`: `null` when Pro or gating is off; file/image types return the Pro-feature error; `itemCount >= 50` returns the item-limit error
   - `getCollectionLimitError(ctx)`: same, for `collectionCount >= 3`
   - `canUseProFeature(isPro)`: `isPro || !isProGatingEnabled()`
3. `src/lib/usage-limits.test.ts` (see Testing)

## Files to Modify

1. `src/auth.ts`
   - Add a `jwt` callback: copy `user.id` to `token.sub` on sign-in, then always look up `isPro` by `token.sub` (`select: { isPro: true }`) and set `token.isPro` (`false` if the user is gone)
   - `session` callback also sets `session.user.isPro = token.isPro ?? false`
   - Keep this in `auth.ts` only; `auth.config.ts` and the proxy stay DB-free
2. `src/types/next-auth.d.ts`
   - `Session.user` gets `isPro: boolean`
   - Augment `next-auth/jwt` `JWT` with `isPro?: boolean`
3. `src/lib/db/users.ts`
   - `BillingAccount` interface and `getBillingAccount(userId)` (email, name, isPro, both Stripe ids)
   - `setStripeCustomerId(userId, customerId)`: `updateMany` where `stripeCustomerId: null`, then return whichever id is stored (handles a double-click race)
   - `applySubscriptionState({ customerId, subscriptionId, isPro })`: when Pro, set `isPro` and `stripeSubscriptionId` by customer; when not Pro, clear only if the stored subscription id matches, so a late event for an old subscription cannot revoke a newer one. Use `updateMany` so unknown customers match zero rows instead of throwing
   - `PlanUsage` interface and `getPlanUsage(userId)` using one `_count` select for items and collections
4. `.env.example`
   - Add `ENFORCE_PRO_LIMITS=""` with a comment (off in development, `"true"` before launch)
   - Note that `STRIPE_PUBLISHABLE_KEY` is unused (hosted Checkout and the Portal need no Stripe.js)

## Key Gotchas

Use Context7 to verify the current stripe-node and NextAuth v5 APIs.

- Do not rely on `trigger === "update"` or `useSession().update()`: the app has no `SessionProvider`, and webhook-driven changes would not reach it. Re-reading `isPro` in the `jwt` callback is the intended approach
- The extra query is one primary-key lookup per `auth()` call (a few per dashboard page). Acceptable; wrap in React `cache()` later if it shows up
- Nothing reads `isPro` for gating yet. This phase changes no user-facing behavior
- With `ENFORCE_PRO_LIMITS` unset, every helper must allow everything

## Testing

Unit tests (`npm test`):

- `src/lib/usage-limits.test.ts`
  - Flag unset or not `"true"`: never returns a limit error, `canUseProFeature(false)` is `true`
  - Flag on, Pro user: no limits at any count, file/image allowed
  - Flag on, free user: 49 items allowed, 50 items blocked; `file` and `image` blocked even at 0 items; other types allowed
  - Flag on, free user: 2 collections allowed, 3 blocked
  - Error messages mention the limit numbers
  - Use `vi.stubEnv` / `vi.unstubAllEnvs` for the flag
- `src/lib/stripe.test.ts`
  - `getStripe()` throws without a key and returns the same instance on repeated calls
  - `getPriceId` returns the right env value per billing period and throws when missing
  - `getAppUrl` falls back to localhost
- `src/lib/db/users.test.ts` (extend, Prisma mocked)
  - `getBillingAccount` select shape
  - `setStripeCustomerId` only writes when none is stored and returns the stored id
  - `applySubscriptionState` where clauses for the Pro and not-Pro branches
  - `getPlanUsage` maps `_count` and returns zeros for a missing user

Manual:

1. Sign in, toggle `isPro` for that user in Prisma Studio on `develop`, reload: `session.user.isPro` follows without signing out
2. `npm run lint` and `npm run build` pass

## References

- `docs/stripe-integration-plan.md`
- NextAuth callbacks: https://authjs.dev/reference/nextjs#callbacks
- stripe-node: https://github.com/stripe/stripe-node
