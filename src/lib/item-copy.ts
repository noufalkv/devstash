interface CopyableItem {
  contentType: "TEXT" | "FILE" | "URL";
  content: string | null;
  url: string | null;
}

/** Text to copy for an item: the URL for links, the content for text types, nothing for files. */
export function getCopyText(item: CopyableItem): string | null {
  if (item.contentType === "FILE") return null;
  const text = item.contentType === "URL" ? item.url : item.content;
  return text?.trim() ? text : null;
}
