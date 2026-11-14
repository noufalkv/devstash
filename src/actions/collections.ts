"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  createCollection as createCollectionQuery,
  getCollectionOptions,
  type CollectionOption,
  type CollectionSummary,
} from "@/lib/db/collections";

export interface CollectionActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const createCollectionSchema = z.object({
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

  const parsed = createCollectionSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const collection = await createCollectionQuery(session.user.id, parsed.data);
    return { success: true, data: collection };
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
