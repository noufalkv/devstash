# Stripe Integration Plan: DevStash Pro

Plan for selling DevStash Pro at **$8/month** or **$72/year** with Stripe Checkout (hosted), the Stripe Customer Portal and webhooks, plus free-tier gating (50 items, 3 collections, no file or image uploads).

_Researched 2026-11-15 against the codebase on `main` (`f0f5f72`) and the stripe-node v23 docs._

---

## 1. Current state

### User model

`prisma/schema.prisma` already has everything the MVP needs, so **no migration is required**:

| Field | Type | Status |
| --- | --- | --- |
| `isPro` | `Boolean @default(false)` | Exists. Never read or written by app code. `prisma/seed.ts:369` sets it to `false` for the demo user. |
| `stripeCustomerId` | `String? @unique` | Exists, unused |
| `stripeSubscriptionId` | `String? @unique` | Exists, unused |

There are no columns for subscription status, price or period end. The plan reads those from Stripe on demand on `/settings`, so the database only stores what gating needs (`isPro`) and the two ids that link a user to Stripe. If renewal dates are later needed in lists or emails, add `stripePriceId` and `stripeCurrentPeriodEnd` in a later migration.

### Auth and session

- `src/auth.config.ts`: edge-safe config (GitHub plus a placeholder Credentials provider, `pages.signIn = "/sign-in"`). It is used by `src/proxy.ts`, which builds its own `NextAuth(authConfig)` **without** the callbacks from `auth.ts`.
- `src/auth.ts`: Prisma adapter, `session: { strategy: "jwt" }`, and a single `session` callback that copies `token.sub` to `session.user.id`. **There is no `jwt` callback yet.**
- `src/types/next-auth.d.ts`: extends `Session.user` with `id` only. There is no `JWT` augmentation.
- Because sessions are JWTs, `isPro` must be put on the token. If it is set only at sign-in, it goes stale when a webhook changes the database. That is the reason for the workaround in the research notes: re-read `isPro` from the database in the `jwt` callback every time.

### How user data is accessed

- Server components and layouts call `await auth()` and pass `session.user.id` into query functions in `src/lib/db/*.ts`. Every query takes a `userId` and returns plain typed objects, not Prisma models.
- Routes that render at request time call `await connection()` before `auth()` when they would otherwise be prerendered (`DashboardSidebar`, `ItemsGrid`, `DashboardPage`).
- Server actions (`src/actions/*.ts`) start with `const session = await auth(); if (!session?.user?.id) return { success: false, error: "You must be signed in" };`, then validate with Zod, call a `src/lib/db` query inside `try/catch` and return `{ success, data, error }`.
- `src/lib/db/users.ts` has `getProfile` (uses `_count` for items and collections) and editor-preference helpers. This is where billing reads and writes belong.

### Existing payment code

There is none. No `stripe` package, no imports, no routes. The only traces are:

- `.env.example`: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY` (all empty).
- Homepage pricing (`src/components/homepage/content.ts`): `PRO_PRICES` ($8/month, $72/year) and `PRO_PLAN.cta` → `/register`.
- Sidebar `PRO_TYPES = new Set(["file", "image"])` in `src/components/layout/sidebar-types.tsx`, which shows a PRO badge only.

---

## 2. Feature gating analysis

### Limits from the spec

| Feature | Free | Pro | Exists today? |
| --- | --- | --- | --- |
| Items | 50 | Unlimited | Yes |
| Collections | 3 | Unlimited | Yes |
| File and image items | No | Yes | Yes (R2 upload) |
| AI features | No | Yes | **Not built** |
| Export (JSON/ZIP) | No | Yes | **Not built** |
| Custom types | No | Coming soon | **Not built** |

> The spec says: "During development, all users can access all features. Pro gating will be enabled before launch." The plan therefore puts gating behind an env flag, `ENFORCE_PRO_LIMITS`, read only by one helper. This follows the `SKIP_EMAIL_VERIFICATION` / `isEmailVerificationEnabled()` pattern in `src/lib/email-verification.ts`.

### Where limits must be enforced (server side)

| Check | Location | Today |
| --- | --- | --- |
| Item count < 50 | `createItem` in `src/actions/items.ts` (after Zod parse, before `createItemQuery`) | No check |
| Collection count < 3 | `createCollection` in `src/actions/collections.ts` | No check |
| File and image types are Pro only | `createItem` (`isFileItemType(parsed.data.type)`) **and** `POST /api/upload` (`src/app/api/upload/route.ts`, before `request.formData()`) | No check |
| Future AI and export endpoints | Use the same `requirePro`-style helper | n/a |

These are the only two create paths. `updateItem` cannot change an item's type, so it needs no check. The upload route is the important one: blocking it **before** the body is parsed also stops free users from filling R2 with orphan uploads (a known gap in the history).

Counts are available from `prisma.item.count({ where: { userId } })` and `prisma.collection.count(...)`, or one `_count` select like `getProfile` uses. A count-then-create check can let two parallel requests reach 51 items. That is acceptable for a soft limit and does not need a transaction.

**Downgrades:** when Pro ends, keep all existing data readable, editable and deletable. Only new creates are blocked. A user with 120 items can still delete down below 50.

### Where limits should be shown (UI)

- `NewItemDialog` (`src/components/items/new-item-dialog.tsx`): disable the File and Image type buttons for free users, with a PRO badge and an upgrade link. Show an "item limit reached" message when the server returns that error, which the existing error toast already handles.
- `/items/files` and `/items/images` "Add" buttons (`src/app/items/[type]/page.tsx`): hide them, or turn them into an upgrade link, for free users.
- `NewCollectionDialog`: the existing error toast shows the limit error. No extra UI is needed for the MVP.
- Server components can read `session.user.isPro` and pass it down as a prop. `DashboardShell` already reads the session.

### Settings page structure

`src/app/settings/page.tsx` is a server component. It calls `auth()`, redirects if signed out, loads `getProfile` and `getEditorPreferences` in parallel and renders:

1. `<h1>Settings</h1>`
2. Editor section (`EditorPreferencesForm` inside `EditorPreferencesProvider`)
3. Account section (`AccountActions` from `src/components/profile/`: Change password, Delete account)

`src/app/settings/loading.tsx` covers the uncached reads, so the page can also await `searchParams` (needed for `?checkout=success`) without an extra `Suspense` boundary. The **Billing** section goes between Editor and Account (see §4).

---

## 3. API and webhook patterns

### API routes

The existing routes are `src/app/api/auth/[...nextauth]`, `api/auth/register`, `api/upload`, `api/download/[id]` and `api/items/[id]`. Conventions:

- `export async function POST(request: Request)` / `GET`
- `NextResponse.json({ error }, { status })` with 400/401/404/409/429/500
- Body parsing in its own `try/catch` that returns 400
- No `export const runtime`, so they run on Node, which is what the Stripe SDK needs.

The webhook goes at `src/app/api/webhooks/stripe/route.ts`, which matches the suggested structure in `project-overview.md`. `src/proxy.ts` only matches page paths (`/dashboard`, `/items`, …), so `/api/webhooks/*` is not intercepted by auth. **Do not add it to the matcher.**

The webhook must read the **raw** body with `await request.text()` and pass it to `stripe.webhooks.constructEvent(body, signature, secret)`. A parsed JSON body fails signature verification.

### Server action error handling

- A result interface is declared per file (`ItemActionResult<T>`, `CollectionActionResult<T>`) with the shape `{ success: boolean; data?: T; error?: string }`.
- Zod `safeParse`, then `parsed.error.issues[0].message` for user-facing errors.
- `try/catch` around DB work returns `"Something went wrong. Please try again."`.
- `null` from a query means "not found". `isRecordNotFound` (`src/lib/db/errors.ts`) maps Prisma P2025 errors.
- Clients show `error` in a sonner toast.

The billing actions follow the same pattern. They **return the Checkout or Portal URL** instead of calling `redirect()`, and the client calls `window.location.assign(url)`. This keeps the `{ success, data, error }` contract, and the client can show an error toast.

### Environment variables

- Integrations read `process.env` lazily inside a `getConfig()`/`getClient()` and throw a clear error when values are missing (`src/lib/r2.ts` is the model: a singleton `S3Client`, created on first use).
- Feature flags have a single reader function (`isEmailVerificationEnabled()`).
- Absolute links are built from `AUTH_URL` (`src/lib/email.ts`).
- `.env.example` already has the five Stripe keys. `STRIPE_PUBLISHABLE_KEY` **is not needed**: hosted Checkout plus the Portal are pure server-side redirects with no Stripe.js. Leave it in place or remove it; nothing should read it.

### Testing patterns

Vitest tests cover only `src/actions` and `src/lib`, are colocated as `*.test.ts`, and mock `@/auth`, `next-auth`, `@/lib/db/*` and integration modules (`@/lib/r2`, `@/lib/email`) with `vi.mock` + `vi.hoisted`. Following this, the webhook's event-handling logic lives in `src/lib/billing.ts` (testable) and the route is a thin wrapper.

---

## 4. Implementation plan

### 4.1 Dependency

```bash
npm install stripe   # v23.x; the SDK pins its own API version (Basil or later)
```

**Breaking change to remember (API 2025-03-31 "Basil"):** `current_period_start`/`current_period_end` **are no longer on the Subscription**. They moved to each subscription item: `subscription.items.data[0].current_period_end`.

### 4.2 Files to create

#### `src/lib/stripe.ts`: lazy client and config

```ts
import Stripe from "stripe";

export type Billing = "monthly" | "yearly";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  client ??= new Stripe(key, { appInfo: { name: "DevStash" } });
  return client;
}

export function getPriceId(billing: Billing): string {
  const id =
    billing === "monthly"
      ? process.env.STRIPE_PRICE_ID_MONTHLY
      : process.env.STRIPE_PRICE_ID_YEARLY;
  if (!id) throw new Error(`Stripe ${billing} price is not configured`);
  return id;
}

export function getAppUrl(): string {
  return process.env.AUTH_URL ?? "http://localhost:3000";
}
```

#### `src/lib/plan-limits.ts`: single source of gating rules

```ts
import { isFileItemType } from "@/lib/file-upload";

export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;

// Off during development (spec: "all users can access all features"); set to "true" before launch.
export function isProGatingEnabled(): boolean {
  return process.env.ENFORCE_PRO_LIMITS === "true";
}

export interface PlanContext {
  isPro: boolean;
  itemCount: number;
  collectionCount: number;
}

export function getItemLimitError(plan: PlanContext, type: string): string | null {
  if (plan.isPro || !isProGatingEnabled()) return null;
  if (isFileItemType(type)) return "File and image uploads are a Pro feature";
  if (plan.itemCount >= FREE_ITEM_LIMIT) {
    return `Free accounts can store up to ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`;
  }
  return null;
}

export function getCollectionLimitError(plan: PlanContext): string | null {
  if (plan.isPro || !isProGatingEnabled()) return null;
  if (plan.collectionCount >= FREE_COLLECTION_LIMIT) {
    return `Free accounts can have up to ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections.`;
  }
  return null;
}

export function canUseProFeature(isPro: boolean): boolean {
  return isPro || !isProGatingEnabled();
}
```

#### `src/lib/billing.ts`: Stripe ↔ database sync (used by the webhook, the success page and delete account)

```ts
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { applySubscriptionState } from "@/lib/db/users";

// past_due keeps Pro while Stripe retries the card; Stripe cancels (-> deleted) when retries run out.
const PRO_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"]);

function customerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer): string {
  return typeof customer === "string" ? customer : customer.id;
}

// Always re-fetches, so retried or out-of-order events apply the latest state
export async function syncSubscription(subscriptionId: string): Promise<void> {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  await applySubscriptionState({
    customerId: customerId(subscription.customer),
    subscriptionId: subscription.id,
    isPro: PRO_STATUSES.has(subscription.status),
  });
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && typeof session.subscription === "string") {
        await syncSubscription(session.subscription);
      }
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object.id);
      return;
    default:
      return; // Unhandled types are acknowledged with 200
  }
}

// Called from /settings after the Checkout redirect, so Pro shows even if the webhook is still in flight
export async function syncCheckoutSession(userId: string, sessionId: string): Promise<boolean> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.client_reference_id !== userId || session.status !== "complete") return false;
  if (typeof session.subscription !== "string") return false;
  await syncSubscription(session.subscription);
  return true;
}

export interface SubscriptionDetails {
  status: Stripe.Subscription.Status;
  billing: "monthly" | "yearly";
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export async function getSubscriptionDetails(
  subscriptionId: string,
): Promise<SubscriptionDetails | null> {
  try {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    const item = subscription.items.data[0];
    return {
      status: subscription.status,
      billing: item?.price.recurring?.interval === "year" ? "yearly" : "monthly",
      // Basil+: period fields live on the subscription item, not the subscription
      currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || subscription.cancel_at !== null,
    };
  } catch {
    return null; // Settings still renders; it just omits the renewal line
  }
}
```

Why it is shaped like this:

- **State-based, not event-based.** Each event re-fetches the subscription and writes the current state. Retries, duplicates and out-of-order delivery (Stripe guarantees neither order nor single delivery) all end in the same state, so no event-id table is needed.
- `checkout.session.completed` and `customer.subscription.created` both fire for a new purchase. Handling both is harmless because the sync is idempotent.
- `invoice.payment_failed` is not needed for gating. The resulting status change arrives as `customer.subscription.updated` (`past_due`, then `deleted`/`canceled`).

#### `src/app/api/webhooks/stripe/route.ts`

```ts
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { handleStripeEvent } from "@/lib/billing";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Signature verification needs the raw body, not parsed JSON
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch {
    // Non-2xx makes Stripe retry with backoff
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

#### `src/actions/billing.ts`: Checkout and Portal

```ts
"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { getAppUrl, getPriceId, getStripe } from "@/lib/stripe";
import { getBillingAccount, setStripeCustomerId } from "@/lib/db/users";

export interface BillingActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const billingSchema = z.enum(["monthly", "yearly"]);

async function getOrCreateCustomer(userId: string): Promise<string | null> {
  const account = await getBillingAccount(userId);
  if (!account) return null;
  if (account.stripeCustomerId) return account.stripeCustomerId;

  // Idempotency key: a double click within 24h reuses the same customer
  const customer = await getStripe().customers.create(
    { email: account.email, name: account.name ?? undefined, metadata: { userId } },
    { idempotencyKey: `customer-${userId}` },
  );
  return setStripeCustomerId(userId, customer.id);
}

export async function createCheckoutSession(
  billing: unknown,
): Promise<BillingActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };
  if (session.user.isPro) return { success: false, error: "You already have Pro" };

  const parsed = billingSchema.safeParse(billing);
  if (!parsed.success) return { success: false, error: "Invalid plan" };

  try {
    const customerId = await getOrCreateCustomer(session.user.id);
    if (!customerId) return { success: false, error: "Account not found" };

    const appUrl = getAppUrl();
    const checkout = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: session.user.id,
      line_items: [{ price: getPriceId(parsed.data), quantity: 1 }],
      subscription_data: { metadata: { userId: session.user.id } },
      success_url: `${appUrl}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings?checkout=canceled`,
    });
    if (!checkout.url) return { success: false, error: "Could not start checkout" };
    return { success: true, data: { url: checkout.url } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function createPortalSession(): Promise<BillingActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };

  try {
    const account = await getBillingAccount(session.user.id);
    if (!account?.stripeCustomerId) return { success: false, error: "No billing account yet" };

    const portal = await getStripe().billingPortal.sessions.create({
      customer: account.stripeCustomerId,
      return_url: `${getAppUrl()}/settings`,
    });
    return { success: true, data: { url: portal.url } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
```

#### `src/components/settings/billing-section.tsx` (server) and `billing-actions.tsx` (client)

- **Server `BillingSection`**, with props `isPro`, `usage` (`itemCount`, `collectionCount`), `subscription: SubscriptionDetails | null`, `hasCustomer` and `checkout?: "success" | "canceled"`:
  - Free: "Free plan", usage `12 / 50 items`, `2 / 3 collections` (from `FREE_ITEM_LIMIT`/`FREE_COLLECTION_LIMIT`), and two buttons: **Upgrade – $8/month** and **Upgrade – $72/year** (prices from `PRO_PRICES` in `homepage/content.ts`, so they are not duplicated).
  - Pro: "Pro plan · Monthly/Yearly", "Renews on {date}" or "Cancels on {date}" when `cancelAtPeriodEnd`, a "Payment failed, update your card" line when `past_due`, and a **Manage billing** button (Portal).
- **Client `UpgradeButton`/`ManageBillingButton`**: call the action in `useTransition`, then `window.location.assign(result.data.url)`, or `toast.error(result.error)`. Disable while pending.
- **Client `CheckoutToast`**: on mount, shows "Welcome to Pro!" or "Checkout canceled", then `router.replace("/settings")` to strip the query string so a reload does not toast again.

#### Tests (new)

| File | Covers |
| --- | --- |
| `src/lib/plan-limits.test.ts` | Flag off → never limits; Pro → never limits; free at 49/50 items; file/image blocked; 2/3 collections |
| `src/lib/billing.test.ts` | Mock `@/lib/stripe` + `@/lib/db/users`: each event type calls sync with the right id; `active`/`trialing`/`past_due` → Pro; `canceled`/`unpaid`/`incomplete_expired` → not Pro; non-subscription checkout ignored; unknown events no-op; `syncCheckoutSession` rejects another user's session or an incomplete one; `getSubscriptionDetails` reads `items.data[0].current_period_end` |
| `src/actions/billing.test.ts` | Signed out; already Pro; invalid plan; reuses an existing customer; creates and stores a new customer; Checkout params (mode, customer, `client_reference_id`, price, URLs); Stripe error → generic error; Portal without customer → error |
| `src/lib/db/users.test.ts` (extend) | `applySubscriptionState` where clauses; `setStripeCustomerId` race (returns the stored id) |
| `src/actions/items.test.ts`, `collections.test.ts` (extend) | Limit errors returned and create not called when over the limit |

Webhook signatures can be exercised in tests with `stripe.webhooks.generateTestHeaderString({ payload, secret })` if the route ever gets a test. Today's convention does not test routes, so test `handleStripeEvent` directly.

### 4.3 Files to modify

#### `src/auth.ts`: add the `jwt` callback (the research-notes workaround)

```ts
callbacks: {
  async jwt({ token, user }) {
    if (user?.id) token.sub = user.id;

    // Always re-read isPro, so a webhook's change shows up on the next request without re-login
    if (token.sub) {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { isPro: true },
      });
      token.isPro = dbUser?.isPro ?? false;
    }
    return token;
  },
  session({ session, token }) {
    if (token.sub) session.user.id = token.sub;
    session.user.isPro = token.isPro ?? false;
    return session;
  },
},
```

Notes:

- Do **not** rely on `trigger === "update"`/`useSession().update()`. The app does not use `useSession` (no `SessionProvider`), and the note explains why it is unreliable for webhook-driven changes.
- Cost: one indexed primary-key lookup per `auth()` call. A dashboard request calls `auth()` several times (page, `DashboardSidebar`, `SearchPalette`, editor-preference loader), so that is a few cheap queries per page view. That is acceptable. If it becomes measurable, wrap the lookup in React `cache()` so it runs once per request.
- Keep this callback in `auth.ts` only, not `auth.config.ts`. The proxy instance stays DB-free and does not need `isPro`.
- A user deleted mid-session gets `isPro = false`. Existing redirects already handle missing profiles.

#### `src/types/next-auth.d.ts`

```ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string; isPro: boolean } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isPro?: boolean;
  }
}
```

#### `src/lib/db/users.ts`: billing queries

```ts
export interface BillingAccount {
  email: string;
  name: string | null;
  isPro: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export function getBillingAccount(userId: string): Promise<BillingAccount | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, isPro: true, stripeCustomerId: true, stripeSubscriptionId: true },
  });
}

// Only sets the id if none is stored; returns whichever id ends up stored
export async function setStripeCustomerId(userId: string, customerId: string): Promise<string | null> {
  await prisma.user.updateMany({
    where: { id: userId, stripeCustomerId: null },
    data: { stripeCustomerId: customerId },
  });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } });
  return user?.stripeCustomerId ?? null;
}

export async function applySubscriptionState(state: {
  customerId: string;
  subscriptionId: string;
  isPro: boolean;
}): Promise<void> {
  if (state.isPro) {
    await prisma.user.updateMany({
      where: { stripeCustomerId: state.customerId },
      data: { isPro: true, stripeSubscriptionId: state.subscriptionId },
    });
    return;
  }
  // Only clear when it is the subscription we have stored, so a late event for an
  // old subscription cannot revoke a newer one
  await prisma.user.updateMany({
    where: { stripeCustomerId: state.customerId, stripeSubscriptionId: state.subscriptionId },
    data: { isPro: false, stripeSubscriptionId: null },
  });
}

export interface PlanUsage {
  itemCount: number;
  collectionCount: number;
}

export async function getPlanUsage(userId: string): Promise<PlanUsage> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { _count: { select: { items: true, collections: true } } },
  });
  return {
    itemCount: user?._count.items ?? 0,
    collectionCount: user?._count.collections ?? 0,
  };
}
```

`updateMany` is used on purpose: it matches zero rows instead of throwing, so events for deleted users or unknown customers succeed quietly. Otherwise Stripe would keep retrying.

#### `src/actions/items.ts`: gate `createItem`

After `createItemSchema.safeParse` and the file-key ownership check:

```ts
const usage = await getPlanUsage(session.user.id);
const limitError = getItemLimitError(
  { isPro: session.user.isPro, collectionCount: usage.collectionCount, itemCount: usage.itemCount },
  parsed.data.type,
);
if (limitError) return { success: false, error: limitError };
```

Put this inside the existing `try`, so a DB error still returns the generic message. Skip the count query when `isProGatingEnabled()` is false or the user is Pro, so dev and Pro users pay nothing.

#### `src/actions/collections.ts`: gate `createCollection`

Same pattern with `getCollectionLimitError`.

#### `src/app/api/upload/route.ts`: gate uploads before reading the body

```ts
if (!canUseProFeature(session.user.isPro)) {
  return NextResponse.json({ error: "File and image uploads are a Pro feature" }, { status: 403 });
}
```

Place it right after the 401 check and before `request.formData()`.

#### `src/actions/profile.ts`: `deleteAccount` cancels the subscription first

Select `stripeSubscriptionId` with `email`. Before `prisma.user.delete`:

```ts
if (user.stripeSubscriptionId) {
  // Fail the delete rather than keep billing a deleted account
  await getStripe().subscriptions.cancel(user.stripeSubscriptionId);
}
```

The resulting `customer.subscription.deleted` webhook then matches no user and is a no-op. Add tests for both the cancel call and the cancel-fails path.

#### `src/app/settings/page.tsx`: add the Billing section

```tsx
export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/settings");
  const userId = session.user.id;

  const { checkout, session_id } = await searchParams;
  if (checkout === "success" && typeof session_id === "string") {
    await syncCheckoutSession(userId, session_id).catch(() => false); // the webhook is the fallback
  }

  const [profile, editorPreferences, account, usage] = await Promise.all([
    getProfile(userId),
    getEditorPreferences(userId),
    getBillingAccount(userId),
    getPlanUsage(userId),
  ]);
  if (!profile || !account) redirect("/sign-in");

  const subscription = account.stripeSubscriptionId
    ? await getSubscriptionDetails(account.stripeSubscriptionId)
    : null;
  // …render Editor, <BillingSection …/>, Account
}
```

Read `isPro` from `account.isPro` (just synced), not from `session.user.isPro`, which was computed before the sync above. Check the `PageProps` helper and `searchParams` typing against `node_modules/next/dist/docs/` (Next 16) before writing this. The existing `loading.tsx` already covers the uncached reads. Update `settings/loading.tsx` with a billing skeleton block.

#### Smaller UI changes

| File | Change |
| --- | --- |
| `src/components/layout/dashboard-shell.tsx` | Pass `session.user.isPro` (with `canUseProFeature`) down to `TopBar` → `NewItemDialog` |
| `src/components/items/new-item-dialog.tsx` | New `canUploadFiles` prop. Disable File and Image in the type picker with a PRO badge and an "Upgrade" link to `/settings` |
| `src/app/items/[type]/page.tsx` | Hide the "Add file/image" button (or link to `/settings`) for free users when gating is on |
| `src/components/homepage/content.ts` | `PRO_PLAN.cta.href` → `/settings`. Signed-out users hit the proxy, go to `/sign-in?callbackUrl=/settings`, and land on billing after signing in |
| `.env.example` | Add `ENFORCE_PRO_LIMITS=""` with a comment. Note that `STRIPE_PUBLISHABLE_KEY` is unused |
| `CLAUDE.md` | Add a Billing bullet to Architecture (webhook path, `isPro` sync in the `jwt` callback, `ENFORCE_PRO_LIMITS`) and `stripe listen` to Commands |

The sidebar PRO badge (`sidebar-types.tsx`) can stay as it is: it labels the types for everyone.

---

## 5. Stripe Dashboard setup

Do everything in **test mode** first, then repeat it in live mode (products, prices, portal configuration and webhook endpoints are separate per mode).

1. **API keys:** Developers → API keys. Copy the secret key (`sk_test_…`) to `STRIPE_SECRET_KEY`. A restricted key with write access to Customers, Checkout Sessions, Subscriptions and Customer Portal also works and is safer in production.
2. **Product and prices:** Product catalog → Add product "DevStash Pro" with two **recurring** prices:
   - $8.00 USD, monthly → `STRIPE_PRICE_ID_MONTHLY` (`price_…`)
   - $72.00 USD, yearly → `STRIPE_PRICE_ID_YEARLY`
3. **Customer portal:** Settings → Billing → Customer portal:
   - Allow customers to update payment methods and view invoice history.
   - Allow cancellation **at the end of the billing period** (the user keeps Pro until then; the app shows "Cancels on …").
   - Allow switching plans between the two DevStash Pro prices, with proration as preferred.
   - Set the default return URL to `https://<domain>/settings` and add business name, terms and privacy links.
   - Save. The portal API fails until a configuration is saved in that mode.
4. **Branding:** Settings → Branding (logo, colors) for Checkout and the Portal.
5. **Webhook endpoint (production or a deployed preview):** Developers → Webhooks → Add endpoint `https://<domain>/api/webhooks/stripe` with events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

   Copy the signing secret (`whsec_…`) to `STRIPE_WEBHOOK_SECRET` in that environment.
6. **Local webhooks (Stripe CLI):**
   ```bash
   brew install stripe/stripe-cli/stripe
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   # prints a whsec_… for local use only → put it in .env as STRIPE_WEBHOOK_SECRET
   ```
7. **Emails (optional):** Settings → Customer emails. Turn on receipts and failed-payment emails so Stripe handles dunning messages and the app does not need to.
8. **Before launch:** set `ENFORCE_PRO_LIMITS="true"`. Run `npm run db:migrate:deploy` on production. The history notes that production is missing `add_editor_preferences`. No Stripe migration is needed.

---

## 6. Testing checklist

### Unit (`npm test`)

- [ ] `plan-limits.test.ts`, `billing.test.ts` and `actions/billing.test.ts` pass
- [ ] Item and collection create actions return limit errors without calling the query
- [ ] `deleteAccount` cancels the subscription and fails cleanly if Stripe errors
- [ ] `npm run lint` and `npm run build` pass (`cacheComponents`: the settings page reads stay under `loading.tsx`)

### Manual, test mode, with `stripe listen` running

Test cards: `4242 4242 4242 4242` (success), `4000 0025 0000 3155` (3-D Secure), `4000 0000 0000 0341` (attaches, but later charges fail). Use any future expiry and any CVC.

- [ ] Free user on `/settings` sees usage and both Upgrade buttons
- [ ] Monthly upgrade → Checkout shows $8/month → pay → back on `/settings` with the "Welcome to Pro" toast, the Pro plan and a renewal date. The query string is removed and a reload shows no toast.
- [ ] Database (Neon `develop`, read only): `isPro = true`, `stripeCustomerId` and `stripeSubscriptionId` set
- [ ] With `stripe listen` stopped, Pro still appears after Checkout (via `syncCheckoutSession`). Restarting the listener and resending the events changes nothing.
- [ ] Yearly upgrade shows $72/year and "Yearly"
- [ ] Cancel Checkout → back on `/settings` with the "Checkout canceled" toast, still Free
- [ ] Upgrade buttons hidden for Pro, and `createCheckoutSession` returns "You already have Pro" if called anyway
- [ ] Manage billing → Portal → switch monthly ↔ yearly → `customer.subscription.updated` → the label changes
- [ ] Portal → cancel at period end → still Pro, "Cancels on …" shown
- [ ] Immediate cancel (`stripe subscriptions cancel sub_…` or Dashboard) → `customer.subscription.deleted` → Free on the next page load, without signing out
- [ ] Failed renewal (card `…0341` plus a test clock to advance time) → `past_due` keeps Pro and shows the payment warning, then Free once Stripe cancels
- [ ] Forged webhook (`curl -X POST …/api/webhooks/stripe -d '{}'`) → 400
- [ ] `stripe trigger checkout.session.completed` for a customer not in the database → 200, no changes
- [ ] Delete account while Pro → subscription canceled in Stripe, account deleted
- [ ] GitHub sign-in user can upgrade (customer created with the GitHub email)

### Gating (with `ENFORCE_PRO_LIMITS="true"`)

- [ ] Free user with 50 items → creating an item shows the limit toast and the dialog stays open
- [ ] Free user with 3 collections → new collection blocked
- [ ] Free user: File and Image disabled in New Item. A direct `POST /api/upload` returns 403 and nothing reaches R2.
- [ ] Pro user: no limits. After downgrade: existing items and files still view, edit and delete; new creates blocked.
- [ ] With the flag unset: everything allowed for everyone (dev behavior unchanged)

---

## 7. Implementation order

Split into two features, following the one-feature-per-branch workflow:

**Feature A: `feature/stripe-subscriptions`** (billing works, nothing is gated yet)

1. `npm install stripe`. Add `src/lib/stripe.ts`.
2. Add the `jwt` callback and `isPro` in `src/auth.ts` and `src/types/next-auth.d.ts`. Verify the session carries `isPro` (toggle it in Prisma Studio on `develop`, then reload).
3. Billing queries in `src/lib/db/users.ts`, plus tests.
4. `src/lib/billing.ts`, plus tests.
5. `src/app/api/webhooks/stripe/route.ts`. Test it with `stripe listen` + `stripe trigger`.
6. `src/actions/billing.ts`, plus tests.
7. Settings Billing section, `CheckoutToast` and the loading skeleton.
8. `deleteAccount` cancellation, plus tests.
9. Homepage Pro CTA → `/settings`. `.env.example`, `CLAUDE.md`.
10. Run the manual Checkout, Portal, cancel and webhook checklist.

**Feature B: `feature/pro-gating`**

1. `src/lib/plan-limits.ts` + `ENFORCE_PRO_LIMITS`, plus tests.
2. `createItem`, `createCollection` and `/api/upload` checks, plus tests.
3. UI: New Item type picker, the `/items/[type]` Add buttons, limit toasts.
4. Gating checklist with the flag on and off.

Later, once those features exist: gate AI and export endpoints with `canUseProFeature(session.user.isPro)`.

---

## 8. Open decisions

| Decision | Recommendation |
| --- | --- |
| Does `past_due` keep Pro? | Yes, while Stripe retries (avoids locking out users over a card hiccup) |
| Free trial? | None (not in the spec). Can be added later with `subscription_data.trial_period_days` |
| Promotion codes in Checkout | Off (not in the spec). One flag later: `allow_promotion_codes: true` |
| Store period end and price in the database | Not for the MVP. Read them from Stripe on `/settings` |
| Rate limit the billing actions | Optional. Checkout sessions are cheap and need a signed-in user. Add a `checkout` limiter to `src/lib/rate-limit.ts` if abuse appears |
| Tax (Stripe Tax) | Out of scope. Enable `automatic_tax` once registered |
