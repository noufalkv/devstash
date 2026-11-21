"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";

import { createPortalSession } from "@/actions/billing";
import type { BillingActionResult } from "@/actions/billing";
import { Button } from "@/components/ui/button";

/** Runs a billing action and sends the browser to the Stripe URL it returns, or toasts its error. */
export function useRedirectAction(action: () => Promise<BillingActionResult<{ url: string }>>) {
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await action();
      if (result.success && result.data) {
        window.location.assign(result.data.url);
        return;
      }
      toast.error(result.error ?? "Something went wrong. Please try again.");
    });
  }

  return { isPending, run };
}

export function ManageBillingButton() {
  const { isPending, run } = useRedirectAction(createPortalSession);
  return (
    <Button variant="outline" onClick={run} disabled={isPending}>
      {isPending ? "Redirecting…" : "Manage billing"}
    </Button>
  );
}

interface CheckoutToastProps {
  status: "success" | "canceled";
  /** The current page, which the URL is replaced with. */
  path: string;
}

// Toasts once, then strips the query string so a reload does not toast again
export function CheckoutToast({ status, path }: CheckoutToastProps) {
  const router = useRouter();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    if (status === "success") {
      toast.success("Welcome to Pro!");
    } else {
      toast("Checkout canceled");
    }
    router.replace(path);
  }, [status, path, router]);

  return null;
}
