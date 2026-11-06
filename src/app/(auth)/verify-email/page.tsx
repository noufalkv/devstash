import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyEmailToken, type VerificationResult } from "@/lib/verification-token";

export const metadata: Metadata = { title: "Verify email | Devstash" };

const MESSAGES: Record<VerificationResult, { title: string; description: string }> = {
  verified: {
    title: "Email verified",
    description: "Your email is verified. You can now sign in.",
  },
  expired: {
    title: "Link expired",
    description: "This verification link has expired. Sign in to request a new one.",
  },
  invalid: {
    title: "Invalid link",
    description: "This verification link is invalid or was already used. Sign in to request a new one.",
  },
};

async function VerifyContent({ searchParams }: Pick<PageProps<"/verify-email">, "searchParams">) {
  const { token, email } = await searchParams;
  const parsedEmail = z.email().safeParse(email);

  const result: VerificationResult =
    typeof token === "string" && parsedEmail.success
      ? await verifyEmailToken(parsedEmail.data.toLowerCase(), token)
      : "invalid";
  const message = MESSAGES[result];

  return (
    <>
      <CardHeader>
        <CardTitle>{message.title}</CardTitle>
        <CardDescription>{message.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/sign-in" className={buttonVariants({ className: "w-full" })}>
          Go to sign in
        </Link>
      </CardContent>
    </>
  );
}

export default function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  return (
    <Card>
      <Suspense
        fallback={
          <CardHeader>
            <CardTitle>Verifying...</CardTitle>
          </CardHeader>
        }
      >
        <VerifyContent searchParams={searchParams} />
      </Suspense>
    </Card>
  );
}
