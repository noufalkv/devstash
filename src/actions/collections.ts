"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  getCollectionOptions,
  updateCollection as updateCollectionQuery,
  type CollectionHeader,
  type CollectionOption,
  type CollectionSummary,
} from "@/lib/db/collections";

export interface CollectionActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const collectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z
    .string()
    .nullish()
    .transform((value) => value?.trim() || null),
});

export async function createCollection(
  data: unknown,
): Promise<CollectionActionResult<CollectionSummary>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };

  const parsed = collectionSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const collection = await createCollectionQuery(session.user.id, parsed.data);
    return { success: true, data: collection };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

const collectionIdSchema = z.string().min(1);

export async function updateCollection(
  collectionId: unknown,
  data: unknown,
): Promise<CollectionActionResult<CollectionHeader>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };

  const id = collectionIdSchema.safeParse(collectionId);
  if (!id.success) return { success: false, error: "Invalid collection" };

  const parsed = collectionSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const collection = await updateCollectionQuery(session.user.id, id.data, parsed.data);
    if (!collection) return { success: false, error: "Collection not found" };
    return { success: true, data: collection };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// Deletes the collection only; its items stay and just leave the collection
export async function deleteCollection(
  collectionId: unknown,
): Promise<CollectionActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };

  const id = collectionIdSchema.safeParse(collectionId);
  if (!id.success) return { success: false, error: "Invalid collection" };

  try {
    const deleted = await deleteCollectionQuery(session.user.id, id.data);
    if (!deleted) return { success: false, error: "Collection not found" };
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function listCollectionOptions(): Promise<
  CollectionActionResult<CollectionOption[]>
> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };

  try {
    const collections = await getCollectionOptions(session.user.id);
    return { success: true, data: collections };
  } catch {
    return { success: false, error: "Could not load collections" };
  }
}
