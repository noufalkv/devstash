"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  CONTENT_TYPES,
  CREATABLE_ITEM_TYPES,
  LANGUAGE_TYPES,
  URL_TYPES,
} from "@/lib/item-fields";
import { isFileItemType, validateFile } from "@/lib/file-upload";
import { deleteFromR2, isOwnedKey } from "@/lib/r2";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  getItemFile,
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

const uploadedFileSchema = z.object({
  key: z.string().min(1),
  name: z.string().trim().min(1),
  size: z.number().int().positive(),
});

const createItemSchema = updateItemSchema
  .extend({
    type: z.enum(CREATABLE_ITEM_TYPES),
    file: uploadedFileSchema.nullish(),
  })
  .superRefine((data, ctx) => {
    if (URL_TYPES.has(data.type) && !data.url) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "URL is required" });
    }
    if (isFileItemType(data.type)) {
      if (!data.file) {
        ctx.addIssue({ code: "custom", path: ["file"], message: "Upload a file first" });
      } else {
        const error = validateFile(data.type, {
          name: data.file.name,
          size: data.file.size,
          type: "",
        });
        if (error) ctx.addIssue({ code: "custom", path: ["file"], message: error });
      }
    }
  })
  .transform((data) => ({
    ...data,
    // Fields the type does not use are dropped
    content: CONTENT_TYPES.has(data.type) ? data.content : null,
    language: LANGUAGE_TYPES.has(data.type) ? data.language : null,
    url: URL_TYPES.has(data.type) ? data.url : null,
    file: isFileItemType(data.type) ? data.file : null,
  }));

export async function createItem(
  data: unknown,
): Promise<ItemActionResult<ItemDetail>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };

  const parsed = createItemSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { file } = parsed.data;
  if (file && !isOwnedKey(session.user.id, file.key)) {
    return { success: false, error: "Invalid file" };
  }

  try {
    const item = await createItemQuery(session.user.id, parsed.data);
    if (!item) return { success: false, error: "Unknown item type" };
    return { success: true, data: item };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

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
    const file = await getItemFile(parsed.data, session.user.id);
    const deleted = await deleteItemQuery(parsed.data, session.user.id);
    if (!deleted) return { success: false, error: "Item not found" };
    if (file) {
      // The item is already gone; a failed cleanup must not fail the delete
      await deleteFromR2(file.key).catch(() => undefined);
    }
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
