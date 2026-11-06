import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Sign in | Devstash" };

const OAUTH_ERROR = "Could not sign in. Try a different method or check your account.";

async function SignInContent({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
  const { callbackUrl, error } = await searchParams;

  return (
    <SignInForm
      callbackUrl={typeof callbackUrl === "string" ? callbackUrl : "/dashboard"}
      notice={error ? OAUTH_ERROR : undefined}
    />
  );
}

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back to Devstash</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="h-72 animate-pulse rounded-lg bg-muted" />}>
          <SignInContent searchParams={searchParams} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
