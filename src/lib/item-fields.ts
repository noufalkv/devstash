// Which form fields each item type uses; shared by the create and edit forms
export const CREATABLE_ITEM_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
] as const;

export type CreatableItemType = (typeof CREATABLE_ITEM_TYPES)[number];

export const CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
export const LANGUAGE_TYPES = new Set(["snippet", "command"]);
export const URL_TYPES = new Set(["link"]);
export const CODE_EDITOR_TYPES = new Set(["snippet", "command"]);
export const MARKDOWN_EDITOR_TYPES = new Set(["note", "prompt"]);
