"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { signInWithCredentials, signInWithGitHub } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";
import { Label } from "@/components/ui/label";

interface SignInFormProps {
  callbackUrl: string;
  notice?: string;
}

export function SignInForm({ callbackUrl, notice }: SignInFormProps) {
  const [state, formAction, pending] = useActionState(signInWithCredentials, null);

  useEffect(() => {
    if (state?.rateLimited && state.error) toast.error(state.error);
  }, [state]);
  const error = state?.error;

  return (
    <div className="space-y-4">
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
        {state?.unverifiedEmail && <ResendVerificationButton email={state.unverifiedEmail} />}
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={signInWithGitHub}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Button type="submit" variant="outline" className="w-full">
          Sign in with GitHub
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-foreground underline underline-offset-4">
          Register
        </Link>
      </p>
    </div>
  );
}
