import { isRecordNotFound } from "@/lib/db/errors";
import { parseEditorPreferences, type EditorPreferences } from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";

export interface SidebarUser {
  name: string | null;
  email: string;
  image: string | null;
}

export function getSidebarUser(userId: string): Promise<SidebarUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true },
  });
}

export interface Profile extends SidebarUser {
  createdAt: Date;
  hasPassword: boolean;
  itemCount: number;
  collectionCount: number;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      createdAt: true,
      password: true,
      _count: { select: { items: true, collections: true } },
    },
  });
  if (!user) return null;

  const { password, _count, ...rest } = user;
  return {
    ...rest,
    hasPassword: password !== null,
    itemCount: _count.items,
    collectionCount: _count.collections,
  };
}

export async function getEditorPreferences(userId: string): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });
  return parseEditorPreferences(user?.editorPreferences);
}

// Returns null when the user no longer exists.
export async function updateEditorPreferences(
  userId: string,
  preferences: EditorPreferences,
): Promise<EditorPreferences | null> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { editorPreferences: { ...preferences } },
      select: { editorPreferences: true },
    });
    return parseEditorPreferences(user.editorPreferences);
  } catch (error) {
    if (isRecordNotFound(error)) return null;
    throw error;
  }
}
