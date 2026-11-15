# Stripe Phase 2 - Integration & UI

## Overview

Connect DevStash to Stripe: hosted Checkout to upgrade, the Customer Portal to manage billing, a webhook that keeps `isPro` in sync, a Billing section on `/settings`, and free-tier gating on item, collection and upload creation. Builds on Phase 1 (`src/lib/stripe.ts`, `src/lib/usage-limits.ts`, `isPro` on the session, billing queries in `src/lib/db/users.ts`). Needs a Stripe test-mode account and the Stripe CLI to test.

Full research and code sketches: `docs/stripe-integration-plan.md` (sections 4–6).

## Requirements

- Webhook at `POST /api/webhooks/stripe` that verifies the signature and syncs subscription state
- Server actions that return a Checkout or Portal URL
- Billing section on `/settings` (between Editor and Account) with usage, upgrade and manage buttons
- Sync the Checkout session on the success redirect, so Pro shows even before the webhook arrives
- Cancel the Stripe subscription when a Pro user deletes their account
- Enforce free-tier limits server-side (when `ENFORCE_PRO_LIMITS="true"`) and reflect them in the UI

## Files to Create

1. `src/lib/billing.ts`
   - `syncSubscription(subscriptionId)`: always re-fetches the subscription and calls `applySubscriptionState`. Pro statuses: `active`, `trialing`, `past_due`
   - `handleStripeEvent(event)`: handles `checkout.session.completed` (subscription mode only), `customer.subscription.created`, `.updated`, `.deleted`; ignores everything else
   - `syncCheckoutSession(userId, sessionId)`: rejects sessions whose `client_reference_id` is another user or whose status is not `complete`
   - `getSubscriptionDetails(subscriptionId)`: status, monthly/yearly, `currentPeriodEnd`, `cancelAtPeriodEnd`; returns `null` on error
2. `src/app/api/webhooks/stripe/route.ts`
   - Read the raw body with `request.text()`, verify with `stripe.webhooks.constructEvent`
   - 400 for a missing or invalid signature, 500 if handling fails (Stripe retries), 200 otherwise
3. `src/actions/billing.ts`
   - `createCheckoutSession(billing)`: session check, reject if already Pro, Zod `"monthly" | "yearly"`, get-or-create the customer (idempotency key `customer-${userId}`, then `setStripeCustomerId`), create a subscription Checkout session with `client_reference_id`, `subscription_data.metadata.userId`, success URL `/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}` and cancel URL `/settings?checkout=canceled`
   - `createPortalSession()`: error if the user has no customer yet; return URL `/settings`
   - Both return `{ success, data: { url }, error }`; no `redirect()`
4. `src/components/settings/billing-section.tsx` (server)
   - Free: "Free plan", `n / 50 items`, `n / 3 collections`, **Upgrade – $8/month** and **Upgrade – $72/year** (prices from `PRO_PRICES` in `homepage/content.ts`)
   - Pro: "Pro plan · Monthly/Yearly", "Renews on {date}" or "Cancels on {date}", a payment-failed line when `past_due`, **Manage billing**
5. `src/components/settings/billing-actions.tsx` (client)
   - `UpgradeButton` / `ManageBillingButton`: call the action in `useTransition`, then `window.location.assign(url)` or `toast.error`; disabled while pending
   - `CheckoutToast`: "Welcome to Pro!" or "Checkout canceled" on mount, then `router.replace("/settings")` so a reload does not toast again

## Files to Modify

1. `src/app/settings/page.tsx`: await `searchParams`; on `checkout=success` call `syncCheckoutSession` (errors ignored, the webhook is the fallback); load `getBillingAccount` and `getPlanUsage` alongside the existing reads; fetch subscription details when a subscription id is stored; render `BillingSection`. Read `isPro` from the account, not the session (the session was computed before the sync)
2. `src/app/settings/loading.tsx`: add a billing skeleton block
3. `src/actions/profile.ts`: `deleteAccount` selects `stripeSubscriptionId` and cancels it before deleting the user; a Stripe error fails the delete
4. `src/actions/items.ts`: `createItem` checks `getItemLimitError` after validation and the file-key check, inside the existing `try`. Skip `getPlanUsage` when the user is Pro or gating is off
5. `src/actions/collections.ts`: `createCollection` checks `getCollectionLimitError` the same way
6. `src/app/api/upload/route.ts`: return 403 `"File and image uploads are a Pro feature"` when `!canUseProFeature(session.user.isPro)`, right after the 401 check and before `request.formData()`
7. `src/components/layout/dashboard-shell.tsx` → `TopBar` → `NewItemDialog`: pass a `canUploadFiles` prop
8. `src/components/items/new-item-dialog.tsx`: disable File and Image in the type picker for free users, with a PRO badge and an Upgrade link to `/settings`
9. `src/app/items/[type]/page.tsx`: hide the "Add file/image" button (or link to `/settings`) for free users when gating is on
10. `src/components/homepage/content.ts`: `PRO_PLAN.cta.href` → `/settings`
11. `CLAUDE.md`: Billing bullet in Architecture (webhook path, `isPro` sync in the `jwt` callback, `ENFORCE_PRO_LIMITS`) and `stripe listen` in Commands

## Key Gotchas

Use Context7 to verify the current stripe-node, Next.js 16 and NextAuth v5 APIs.

- Basil API (2025-03-31) and later: `current_period_end` is on `subscription.items.data[0]`, not on the subscription
- The webhook must use the raw body; parsed JSON fails signature verification
- Do not add `/api/webhooks/*` to the `src/proxy.ts` matcher
- Sync is state-based (re-fetch on every event), so duplicate, retried and out-of-order events end in the same state. No event-id table
- `updateMany` in `applySubscriptionState` means events for unknown or deleted users return 200 quietly
- Downgrades keep existing data readable, editable and deletable; only new creates are blocked
- Count-then-create can briefly allow 51 items under parallel requests; acceptable for a soft limit
- Check `PageProps<"/settings">` and `searchParams` typing in `node_modules/next/dist/docs/` before editing the settings page
- Keep the settings reads under `loading.tsx` so the `cacheComponents` build passes

## Stripe Setup (test mode)

1. Copy the secret key to `STRIPE_SECRET_KEY`
2. Create the "DevStash Pro" product with recurring $8/month and $72/year prices → `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`
3. Configure and save the Customer Portal: payment methods, invoices, cancel at period end, switching between the two prices, return URL `/settings`
4. Local webhooks:
   ```bash
   brew install stripe/stripe-cli/stripe
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   # copy the printed whsec_… to STRIPE_WEBHOOK_SECRET
   ```
5. Production later: add the endpoint with the four events above, then set `ENFORCE_PRO_LIMITS="true"`

## Testing

Unit tests (`npm test`):

- `src/lib/billing.test.ts`: each event type syncs the right id; Pro vs non-Pro statuses; non-subscription checkout ignored; unknown events no-op; `syncCheckoutSession` rejects another user's or an incomplete session; `getSubscriptionDetails` reads `items.data[0].current_period_end` and returns `null` on error
- `src/actions/billing.test.ts`: signed out; already Pro; invalid plan; existing customer reused; new customer created and stored; Checkout params; Stripe error → generic error; Portal without a customer → error
- `src/actions/items.test.ts`, `src/actions/collections.test.ts`: limit errors returned and the create query not called when over the limit
- `src/actions/profile.test.ts`: `deleteAccount` cancels the subscription; a cancel failure stops the delete

Manual with `stripe listen` running (cards: `4242 4242 4242 4242`, `4000 0025 0000 3155` for 3-D Secure, `4000 0000 0000 0341` for failing renewals):

1. Free user on `/settings` sees usage and both Upgrade buttons
2. Monthly upgrade → pay → back on `/settings` with the toast, Pro plan and renewal date; reload shows no toast; `isPro` and both ids set in the `develop` database
3. With `stripe listen` stopped, Pro still shows after Checkout; resending the events changes nothing
4. Yearly upgrade shows $72/year and "Yearly"; canceling Checkout leaves the user Free with the canceled toast
5. Portal: switch monthly ↔ yearly updates the label; cancel at period end shows "Cancels on …" and stays Pro
6. Immediate cancel (`stripe subscriptions cancel sub_…`) → Free on the next page load without signing out
7. Forged webhook (`curl -X POST localhost:3000/api/webhooks/stripe -d '{}'`) → 400; `stripe trigger checkout.session.completed` for an unknown customer → 200, no changes
8. Delete account while Pro → subscription canceled in Stripe
9. With `ENFORCE_PRO_LIMITS="true"`: 50 items blocks item creation with a toast; 3 collections blocks collection creation; File/Image disabled in New Item and `POST /api/upload` returns 403 with nothing in R2; Pro has no limits
10. With the flag unset: everything allowed for everyone
11. `npm run lint` and `npm run build` pass

## References

- `docs/stripe-integration-plan.md`
- Checkout subscriptions: https://docs.stripe.com/billing/subscriptions/build-subscriptions
- Webhooks: https://docs.stripe.com/webhooks
- Customer Portal: https://docs.stripe.com/customer-management
- Stripe CLI: https://docs.stripe.com/stripe-cli
