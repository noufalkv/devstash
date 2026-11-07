"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
  type ItemDetail,
} from "@/lib/db/items";

export interface ItemActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const optionalText = z
  .string()
  .nullish()
  .transform((value) => value?.trim() || null);

const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: optionalText,
  content: z
    .string()
    .nullish()
    .transform((value) => (value?.trim() ? value : null)),
  url: z
    .string()
    .nullish()
    .transform((value) => value?.trim() || null)
    .refine((value) => value === null || URL.canParse(value), "URL is not valid"),
  language: optionalText,
  tags: z
    .array(z.string())
    .transform((tags) => [
      ...new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
    ]),
});

export async function updateItem(
  itemId: string,
  data: unknown,
): Promise<ItemActionResult<ItemDetail>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };

  const parsed = updateItemSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const item = await updateItemQuery(itemId, session.user.id, parsed.data);
    if (!item) return { success: false, error: "Item not found" };
    return { success: true, data: item };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function deleteItem(itemId: unknown): Promise<ItemActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };

  const parsed = z.string().min(1).safeParse(itemId);
  if (!parsed.success) return { success: false, error: "Invalid item" };

  try {
    const deleted = await deleteItemQuery(parsed.data, session.user.id);
    if (!deleted) return { success: false, error: "Item not found" };
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
