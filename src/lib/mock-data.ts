// Single source of truth for mock dashboard data until a database is wired up.

export interface User {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  plan: "free" | "pro";
}

export interface ItemType {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // hex
}

export interface Item {
  id: string;
  title: string;
  description: string;
  itemTypeId: string;
  language?: string;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  updatedAt: string;
  collectionIds: string[];
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  itemTypeIds: string[];
}

export const currentUser: User = {
  id: "user-1",
  name: "Alex Johnson",
  email: "alex@devstash.app",
  avatarInitials: "AJ",
  plan: "free",
};

export const itemTypes: ItemType[] = [
  { id: "snippet", name: "Snippet", icon: "Code", color: "#3b82f6" },
  { id: "prompt", name: "Prompt", icon: "Sparkles", color: "#8b5cf6" },
  { id: "command", name: "Command", icon: "Terminal", color: "#f97316" },
  { id: "note", name: "Note", icon: "StickyNote", color: "#fde047" },
  { id: "file", name: "File", icon: "File", color: "#6b7280" },
  { id: "image", name: "Image", icon: "Image", color: "#ec4899" },
  { id: "link", name: "Link", icon: "Link", color: "#10b981" },
];

export const itemTypeCounts: Record<string, number> = {
  snippet: 24,
  prompt: 18,
  command: 12,
  note: 9,
  file: 6,
  image: 4,
  link: 14,
};

export const collections: Collection[] = [
  {
    id: "react-patterns",
    name: "React Patterns",
    description: "Reusable patterns for modern React apps",
    itemCount: 18,
    itemTypeIds: ["snippet", "file", "link"],
  },
  {
    id: "prompt-library",
    name: "Prompt Library",
    description: "Prompts that actually ship useful work",
    itemCount: 14,
    itemTypeIds: ["prompt", "file", "link"],
  },
  {
    id: "context-files",
    name: "Context Files",
    description: "Project briefs, docs, and references",
    itemCount: 9,
    itemTypeIds: ["file", "file", "image"],
  },
  {
    id: "ship-faster",
    name: "Ship Faster",
    description: "Commands and shortcuts for daily flow",
    itemCount: 22,
    itemTypeIds: ["command", "snippet", "prompt"],
  },
];

export const items: Item[] = [
  {
    id: "use-debounce-hook",
    title: "useDebounce hook",
    description:
      "A tiny, production-ready debounce hook for search and autosave experiences.",
    itemTypeId: "snippet",
    language: "TypeScript",
    tags: ["react", "hooks"],
    isFavorite: true,
    isPinned: false,
    updatedAt: "2 min ago",
    collectionIds: ["react-patterns", "ship-faster"],
  },
  {
    id: "senior-frontend-review",
    title: "Senior frontend review",
    description:
      "Review this pull request like a staff engineer. Prioritize correctness, accessibility, and maintainability.",
    itemTypeId: "prompt",
    tags: ["review", "frontend"],
    isFavorite: false,
    isPinned: false,
    updatedAt: "18 min ago",
    collectionIds: ["prompt-library"],
  },
  {
    id: "git-cleanup-aliases",
    title: "git cleanup aliases",
    description:
      "Aliases for pruning branches, inspecting history, and keeping a clean local workspace.",
    itemTypeId: "command",
    language: "Bash",
    tags: ["git", "cli"],
    isFavorite: false,
    isPinned: false,
    updatedAt: "Yesterday",
    collectionIds: ["ship-faster"],
  },
  {
    id: "app-router-checklist",
    title: "App router checklist",
    description:
      "The final pass before shipping a Next.js app: metadata, errors, loading, and accessibility.",
    itemTypeId: "note",
    tags: ["next.js", "launch"],
    isFavorite: false,
    isPinned: false,
    updatedAt: "Yesterday",
    collectionIds: ["context-files"],
  },
  {
    id: "build-a-command-palette",
    title: "Build a command palette",
    description:
      "A keyboard-first command palette pattern with grouped actions and fuzzy search.",
    itemTypeId: "snippet",
    language: "React",
    tags: ["ui", "keyboard"],
    isFavorite: false,
    isPinned: false,
    updatedAt: "3 days ago",
    collectionIds: ["react-patterns"],
  },
  {
    id: "linear-design-notes",
    title: "Linear design notes",
    description:
      "A visual reference for building calm, dense, keyboard-friendly product interfaces.",
    itemTypeId: "link",
    tags: ["inspiration"],
    isFavorite: false,
    isPinned: false,
    updatedAt: "4 days ago",
    collectionIds: ["context-files"],
  },
];
