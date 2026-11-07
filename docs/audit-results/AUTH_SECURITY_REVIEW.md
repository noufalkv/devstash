# Auth Security Review

**Last audit:** 2026-11-07
**Scope:** `src/auth.ts`, `src/auth.config.ts`, `src/proxy.ts`, `src/actions/auth.ts`, `src/actions/profile.ts`, `src/lib/verification-token.ts`, `src/lib/email.ts`, `src/lib/email-verification.ts`, `src/lib/db/users.ts`, `src/app/api/auth/**` (register and NextAuth route), pages `/sign-in`, `/verify-email`, `/forgot-password`, `/reset-password`, `/profile`, `src/components/auth/sign-in-form.tsx` and `reset-password-form.tsx`, `.env.example`, `.gitignore`, `next.config.ts`. `register-form.tsx`, `forgot-password-form.tsx`, `resend-verification-button.tsx`, `src/components/profile/*` and `src/lib/prisma.ts` were not opened. The `/register` page was not read directly, and `src/app/(auth)/register/page.tsx` appeared only in the file listing.

## Summary

- Critical: 0
- High: 1
- Medium: 4
- Low: 4

Fix first:
1. Add rate limiting. `UPSTASH_REDIS_REST_*` is already in `.env.example`, but no code uses it. Start with the endpoints that send email, then sign-in.
2. Invalidate existing sessions after a password reset or change. JWT sessions currently survive both.
3. Remove the account-enumeration signals: the register 409, the send-failure errors, and the sign-in timing difference.

## Findings

### 🟠 High

- **`src/actions/auth.ts:35`** (also `:86`, `:108`, `:143`, `src/app/api/auth/register/route.ts:25`, `src/actions/profile.ts:28`): No throttling exists on sign-in, register, resend verification, forgot password, reset password or change password.
  - **Why:** A grep of `src/` for rate/throttle/upstash found no code. There is no `vercel.json` and no middleware beyond `src/proxy.ts`, which only guards `/dashboard` and `/profile`. Consequences:
    - An attacker can call `requestPasswordReset` or `resendVerification` in a loop against a victim's address. This mail-bombs the victim, burns the Resend quota and hurts sender reputation.
    - Unlimited password guesses are possible at sign-in. bcrypt cost 12 slows each guess but does not stop a distributed attack.
    - Anyone can script unlimited `POST /api/auth/register` calls. Each call creates a DB row, runs bcrypt and sends an email.
    - `changePassword` lets a hijacked session brute-force the current password.
  - **Fix:** Use `@upstash/ratelimit` with the existing Upstash env vars. Keep a limiter per action, keyed on IP plus normalized email:
    ```ts
    const limiter = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(5, "15 m") });
    const { success } = await limiter.limit(`forgot:${ip}:${email}`);
    if (!success) return { success: false, error: "Too many attempts. Try again later." };
    ```
    Suggested limits: sign-in about 5 per 15 minutes per email and IP, email-sending actions about 3 per hour per email, register about 5 per hour per IP, `changePassword` keyed on `session.user.id`.

### 🟡 Medium

- **`src/auth.ts:54`** (consumers: `src/actions/auth.ts:164`, `src/actions/profile.ts:54`): A password reset or change does not invalidate existing sessions.
  - **Why:** Sessions are stateless JWTs and there is no token-version or `passwordChangedAt` check in the `session` callback (`src/auth.ts:56-59`). If an attacker has a stolen session, the victim resets the password, and the attacker stays signed in until the JWT expires. This is the exact reason users reset passwords.
  - **Fix:** Add `passwordChangedAt` (or `tokenVersion`) to `User`. Put it in the JWT at sign-in via a `jwt` callback. In the `jwt` or `session` callback, compare it with the DB value and reject on mismatch. Bump it in `resetPassword` and `changePassword`.

- **`src/auth.ts:40`**: Sign-in timing differs between unknown and known accounts.
  - **Why:** An unknown email or a user without a password returns at line 40 without running bcrypt. A known account runs `bcrypt.compare` at cost 12, which takes roughly 200 ms or more. Timing the response reveals which emails are registered. `requestPasswordReset` (`src/actions/auth.ts:117-121`) and `resendVerification` (`:94-98`) have the same problem: only existing accounts perform a DB write and an email send. This undermines the "always succeeds" comments on those actions.
  - **Fix:** Compare against a constant dummy hash when the user or password is missing:
    ```ts
    const hash = user?.password ?? DUMMY_BCRYPT_HASH; // precomputed at cost 12
    const valid = await bcrypt.compare(password, hash);
    if (!user?.password || !valid) return null;
    ```
    For the email-sending actions, send the email in the background (for example `after()`) so the response time does not depend on whether the account exists.

- **`src/app/api/auth/register/route.ts:47`** (also `:79-81`): Register returns an explicit 409 "A user with this email already exists".
  - **Why:** Anyone can probe any email address and learn whether it has an account. This contradicts the enumeration protection used elsewhere.
  - **Fix:** Return the same success response for existing emails, for example "If this email can be registered, check your inbox", and email the existing owner a "you already have an account" notice. If the explicit message is kept for UX, rate limiting (above) is the minimum mitigation.

- **`src/actions/auth.ts:97`** and **`:120`**: The send-failure branch returns an error only for existing accounts.
  - **Why:** For an unknown email the action returns `success: true`. For an existing account whose email send fails, it returns "Could not send the email". An attacker who can make sends fail can tell the two cases apart. A flood of requests to exhaust the Resend quota (see the rate limiting finding) produces this signal for existing accounts only. `context/current-feature.md` lists this as a known gap, and it is still true.
  - **Fix:** Log the failure server-side and return `{ success: true }` regardless.

- **`src/lib/email-verification.ts:2`**: `SKIP_EMAIL_VERIFICATION=true` has no production guard.
  - **Why:** The only condition is `process.env.SKIP_EMAIL_VERIFICATION !== "true"`. If the variable leaks into the production environment (for example copied from `.env` while the Resend domain is unverified, which the current notes say is the reason to use it), three things happen:
    - Register marks every new user verified (`route.ts:58`).
    - `authorize` skips the verification check (`src/auth.ts:45`).
    - Anyone can then register with an email address they do not own, such as a victim's, and sign in.
  - **Fix:** Ignore the flag when `process.env.NODE_ENV === "production"`, or fail at startup:
    ```ts
    export function isEmailVerificationEnabled() {
      if (process.env.NODE_ENV === "production") return true;
      return process.env.SKIP_EMAIL_VERIFICATION !== "true";
    }
    ```

### 🔵 Low

- **`src/actions/auth.ts:156-165`**: The reset token is consumed before the password is updated.
  - **Why:** If `bcrypt.hash` or `prisma.user.update` throws after `consumePasswordResetToken` succeeds, the token is already deleted. The user sees "Something went wrong" and has to request a new link. This is a reliability issue, not an exploit. The consume itself is atomic and correct (see Passed Checks), and consuming first is the safer order against replay.
  - **Fix:** Optional. Run the delete and the user update in one `prisma.$transaction`, so a failed update rolls the delete back.

- **`src/app/(auth)/verify-email/page.tsx:33`**: Email verification is a state change on a GET render.
  - **Why:** `verifyEmailToken` runs while the page renders. Email security scanners and link prefetchers that open the link consume the single-use token. The user then sees "invalid or was already used", and has to request another link from sign-in. `/reset-password` is not affected, because its page only calls the read-only `checkPasswordResetToken`.
  - **Fix:** Render a "Confirm email" button that submits a server action, and only verify on that POST.

- **`src/app/api/auth/register/route.ts:17`** (also `src/actions/auth.ts:135`, `src/actions/profile.ts:20`): The password max of 72 is checked in characters, but bcrypt truncates at 72 bytes.
  - **Why:** Zod `.max(72)` counts UTF-16 code units. A password of multi-byte characters can exceed 72 bytes and bcryptjs silently ignores the tail. Two passwords sharing the first 72 bytes are then treated as equal, and the user gets less entropy than they typed.
  - **Fix:** Add a byte-length check: `.refine((p) => new TextEncoder().encode(p).length <= 72, "Password is too long")`.

- **`src/actions/profile.ts:62-84`**: Account deletion needs only a valid session plus the typed email.
  - **Why:** The session check and the typed-email confirmation are in place, but the typed email is shown on the profile page, so it is not a secret. A hijacked session, or an unattended signed-in browser, can irreversibly delete the account and all its data without knowing the password.
  - **Fix:** For users with a password, also require the current password, using the same `bcrypt.compare` as `changePassword`.

## ✅ Passed Checks

- **Password hashing:** bcryptjs at cost 12 in register (`src/app/api/auth/register/route.ts:55`), reset (`src/actions/auth.ts:164`) and change (`src/actions/profile.ts:54`). Max length 72 and min 8 are enforced with Zod in all three places.
- **Hash exposure:** `getProfile` selects the password hash but strips it and returns only `hasPassword` (`src/lib/db/users.ts:37-40`). The register response selects only id, name and email (`route.ts:59`). The `authorize` return value contains no password (`src/auth.ts:49`). No `console.*` logging of credentials or tokens in the audited files.
- **Token generation and storage:** `randomBytes(32)` gives 256 bits from a CSPRNG. Only the SHA-256 hash is stored (`src/lib/verification-token.ts:21-29`). The raw token exists only in the emailed link.
- **One active token per email:** `issueToken` deletes the existing tokens and creates the new one in a single `$transaction` (`verification-token.ts:23-32`).
- **Expiry and single use:** Expiry is enforced on use (`:52`), and TTLs are 24 hours for verification and 1 hour for reset (`:4-5`). Single use is atomic: `deleteMany` with a `count === 0` check (`:48-51`) means that when two requests race on the same token, only one gets `valid`.
- **Separate identifiers:** Reset tokens use the `password-reset:<email>` identifier (`:15-17`), so a reset token cannot verify an email and a verification token cannot reset a password. Both are bound to the email in the lookup (`identifier_token`).
- **Verification enforcement:** `authorize` blocks unverified users after the password check, which gives the "unverified" signal only to someone who knows the password (`src/auth.ts:45-47`). GitHub is the only other provider. The adapter-based sign-in has no `allowDangerousEmailAccountLinking` in `src/auth.config.ts:8` or `src/auth.ts`, so GitHub sign-in cannot link into an existing unverified email/password account.
- **Reset account enumeration (response level):** `requestPasswordReset` returns `success: true` for unknown emails and for OAuth-only users (`src/actions/auth.ts:117-122`). The reset page shows the same message for missing, wrong or used tokens (`reset-password/page.tsx:13-16`).
- **Reset form integrity:** `resetPassword` validates input with Zod, and the token is bound to the email, so a client cannot reset another user's password by editing the hidden email field (`src/actions/auth.ts:128-156`).
- **Profile actions:** Both `changePassword` and `deleteAccount` call `auth()` server-side and act only on `session.user.id`. No client-supplied id or email selects the target (`src/actions/profile.ts:32-33`, `:43-45`, `:55`, `:66-67`, `:84`). `changePassword` validates with Zod and verifies the current password before changing it (`:51-52`). `deleteAccount` blocks the demo account and requires the typed email to match (`:75-82`).
- **Profile page protection:** `/profile/:path*` and `/dashboard/:path*` are in the proxy matcher (`src/proxy.ts:15-17`). `profile/page.tsx:13-14` re-checks the session server-side.
- **Open redirects:** `getSafeRedirect` accepts only paths that start with `/` and not `//` (`src/actions/auth.ts:30-33`), applied to both credentials and GitHub sign-in (`:50`, `:76`). The `callbackUrl` that the proxy builds is relative (`src/proxy.ts:9-10`).
- **Email HTML:** Email links are built with `URLSearchParams` (`src/lib/email.ts:9`, `:24`), so token and email are URL-encoded. No user-controlled name or free text is interpolated into the HTML.
- **Secrets:** `.env*` is gitignored with only `.env.example` allowed (`.gitignore:34-35`). `.env.example` contains empty values. `RESEND_API_KEY` is read only in the server-only `email.ts`. Error responses are generic ("Something went wrong") and do not expose internals.
- **Sign-in error handling:** Wrong password and unknown email produce the same "Invalid email or password" message (`src/actions/auth.ts:62-68`).
- **Register concurrency:** A unique-constraint race (P2002) is handled (`route.ts:78-83`).
