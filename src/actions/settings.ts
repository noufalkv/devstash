"use server";

import { auth } from "@/auth";
import { updateEditorPreferences as updateEditorPreferencesQuery } from "@/lib/db/users";
import { editorPreferencesSchema, type EditorPreferences } from "@/lib/editor-preferences";

export interface SettingsActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function updateEditorPreferences(
  data: unknown,
): Promise<SettingsActionResult<EditorPreferences>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };

  const parsed = editorPreferencesSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const preferences = await updateEditorPreferencesQuery(session.user.id, parsed.data);
    if (!preferences) return { success: false, error: "Account not found" };
    return { success: true, data: preferences };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
