import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { checkPasswordResetToken, type PasswordResetTokenResult } from "@/lib/verification-token";

export const metadata: Metadata = { title: "Reset password | Devstash" };

const INVALID_MESSAGES: Record<Exclude<PasswordResetTokenResult, "valid">, string> = {
  expired: "This reset link has expired. Request a new one.",
  invalid: "This reset link is invalid or was already used. Request a new one.",
};

async function ResetContent({ searchParams }: Pick<PageProps<"/reset-password">, "searchParams">) {
  const { token, email } = await searchParams;
  const parsedEmail = z.email().safeParse(email);

  const result: PasswordResetTokenResult =
    typeof token === "string" && parsedEmail.success
      ? await checkPasswordResetToken(parsedEmail.data.toLowerCase(), token)
      : "invalid";

  if (result === "valid" && typeof token === "string" && parsedEmail.success) {
    return (
      <>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Choose a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm email={parsedEmail.data.toLowerCase()} token={token} />
        </CardContent>
      </>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle>{result === "expired" ? "Link expired" : "Invalid link"}</CardTitle>
        <CardDescription>
          {INVALID_MESSAGES[result === "expired" ? "expired" : "invalid"]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/forgot-password" className={buttonVariants({ className: "w-full" })}>
          Request a new link
        </Link>
      </CardContent>
    </>
  );
}

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <Card>
      <Suspense
        fallback={
          <CardHeader>
            <CardTitle>Checking link...</CardTitle>
          </CardHeader>
        }
      >
        <ResetContent searchParams={searchParams} />
      </Suspense>
    </Card>
  );
}
