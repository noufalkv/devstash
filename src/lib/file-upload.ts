export const FILE_ITEM_TYPES = ["file", "image"] as const;

export type FileItemType = (typeof FILE_ITEM_TYPES)[number];

export interface FileRule {
  maxSize: number;
  extensions: string[];
  mimeTypes: string[];
}

const MB = 1024 * 1024;

export const FILE_RULES: Record<FileItemType, FileRule> = {
  image: {
    maxSize: 5 * MB,
    extensions: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
    mimeTypes: [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
  },
  file: {
    maxSize: 10 * MB,
    extensions: [
      ".pdf",
      ".txt",
      ".md",
      ".json",
      ".yaml",
      ".yml",
      ".xml",
      ".csv",
      ".toml",
      ".ini",
    ],
    mimeTypes: [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/json",
      "application/x-yaml",
      "text/yaml",
      "application/xml",
      "text/xml",
      "text/csv",
      "application/toml",
    ],
  },
};

export function isFileItemType(type: unknown): type is FileItemType {
  return typeof type === "string" && (FILE_ITEM_TYPES as readonly string[]).includes(type);
}

export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Returns an error message, or null when the file is allowed.
// Browsers often send an empty or generic MIME type for .md, .yaml, .toml and
// .ini files, so the extension is the main check and the MIME type is only
// rejected when it is present and clearly wrong.
export function validateFile(
  type: FileItemType,
  file: { name: string; size: number; type: string },
): string | null {
  const rule = FILE_RULES[type];
  const label = type === "image" ? "images" : "files";

  if (!rule.extensions.includes(getExtension(file.name))) {
    return `Unsupported ${type} type. Allowed: ${rule.extensions.join(", ")}`;
  }
  if (file.size <= 0) return "The file is empty";
  if (file.size > rule.maxSize) {
    return `Max size for ${label} is ${formatFileSize(rule.maxSize)}`;
  }
  const mime = file.type.trim().toLowerCase();
  const generic = ["", "application/octet-stream"];
  // Browsers report aliases such as image/jpg or image/x-png, so images accept
  // any image/* type; the extension is the real allow-list.
  const mimeOk =
    generic.includes(mime) ||
    rule.mimeTypes.includes(mime) ||
    (type === "image" && mime.startsWith("image/"));
  if (!mimeOk) {
    return `The file's type (${mime}) does not match its extension`;
  }
  return null;
}

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

// The type stored in R2; images get a canonical type so previews always render
export function resolveContentType(
  type: FileItemType,
  file: { name: string; type: string },
): string {
  if (type === "image") {
    return IMAGE_MIME_BY_EXTENSION[getExtension(file.name)] ?? "application/octet-stream";
  }
  return file.type || "application/octet-stream";
}
