"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { resendVerification } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function ResendVerificationButton({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleClick() {
    startTransition(async () => {
      const result = await resendVerification(email);
      if (result.success) {
        setSent(true);
        toast.success("Verification email sent.");
      } else {
        toast.error(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <Button type="button" variant="outline" className="w-full" onClick={handleClick} disabled={pending || sent}>
      {pending ? "Sending..." : sent ? "Email sent" : "Resend verification email"}
    </Button>
  );
}
