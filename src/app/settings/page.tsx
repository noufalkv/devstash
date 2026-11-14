import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccountActions } from "@/components/profile/account-actions";
import { getProfile } from "@/lib/db/users";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/settings");

  const profile = await getProfile(session.user.id);
  if (!profile) redirect("/sign-in");

  return (
    <>
      <h1 className="text-3xl font-semibold">Settings</h1>
      <AccountActions email={profile.email} hasPassword={profile.hasPassword} />
    </>
  );
}
