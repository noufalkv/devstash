import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccountActions } from "@/components/profile/account-actions";
import { BillingSection } from "@/components/settings/billing-section";
import { EditorPreferencesForm } from "@/components/settings/editor-preferences-form";
import { EditorPreferencesProvider } from "@/components/settings/editor-preferences-provider";
import { getSubscriptionDetails, syncCheckoutSession } from "@/lib/billing";
import {
  getBillingAccount,
  getEditorPreferences,
  getPlanUsage,
  getProfile,
} from "@/lib/db/users";

function parseCheckout(value: string | string[] | undefined): "success" | "canceled" | undefined {
  return value === "success" || value === "canceled" ? value : undefined;
}

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/settings");
  const userId = session.user.id;

  const { checkout: checkoutParam, session_id: sessionId } = await searchParams;
  const checkout = parseCheckout(checkoutParam);
  if (checkout === "success" && typeof sessionId === "string") {
    // The webhook is the fallback if this sync fails
    await syncCheckoutSession(userId, sessionId).catch(() => false);
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

  return (
    <>
      <h1 className="text-3xl font-semibold">Settings</h1>
      <EditorPreferencesProvider initialPreferences={editorPreferences}>
        <EditorPreferencesForm />
      </EditorPreferencesProvider>
      {/* isPro comes from the account, which reflects the sync above; the session was read before it */}
      <BillingSection
        isPro={account.isPro}
        usage={usage}
        subscription={subscription}
        hasCustomer={account.stripeCustomerId !== null}
        checkout={checkout}
      />
      <AccountActions email={profile.email} hasPassword={profile.hasPassword} />
    </>
  );
}
