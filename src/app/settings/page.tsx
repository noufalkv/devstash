import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccountActions } from "@/components/profile/account-actions";
import { EditorPreferencesForm } from "@/components/settings/editor-preferences-form";
import { EditorPreferencesProvider } from "@/components/settings/editor-preferences-provider";
import { getEditorPreferences, getProfile } from "@/lib/db/users";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/settings");

  const [profile, editorPreferences] = await Promise.all([
    getProfile(session.user.id),
    getEditorPreferences(session.user.id),
  ]);
  if (!profile) redirect("/sign-in");

  return (
    <>
      <h1 className="text-3xl font-semibold">Settings</h1>
      <EditorPreferencesProvider initialPreferences={editorPreferences}>
        <EditorPreferencesForm />
      </EditorPreferencesProvider>
      <AccountActions email={profile.email} hasPassword={profile.hasPassword} />
    </>
  );
}
