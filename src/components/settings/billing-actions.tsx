"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";

import { createCheckoutSession, createPortalSession } from "@/actions/billing";
import type { BillingActionResult } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import type { Billing } from "@/lib/stripe";

function useRedirectAction(action: () => Promise<BillingActionResult<{ url: string }>>) {
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

interface UpgradeButtonProps {
  billing: Billing;
  label: string;
  variant?: "default" | "outline";
}

export function UpgradeButton({ billing, label, variant = "default" }: UpgradeButtonProps) {
  const { isPending, run } = useRedirectAction(() => createCheckoutSession(billing));
  return (
    <Button variant={variant} onClick={run} disabled={isPending}>
      {isPending ? "Redirecting…" : label}
    </Button>
  );
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
}

// Toasts once, then strips the query string so a reload does not toast again
export function CheckoutToast({ status }: CheckoutToastProps) {
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
    router.replace("/settings");
  }, [status, router]);

  return null;
}
