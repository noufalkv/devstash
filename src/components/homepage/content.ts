import {
  Code,
  FolderOpen,
  type LucideIcon,
  Search,
  Sparkles,
  Terminal,
  FileText,
} from "lucide-react";

/** Page-width wrapper shared by every section. */
export const HOME_CONTAINER = "mx-auto w-full max-w-6xl px-4 md:px-6";

/* ============================================
   Type colors
   ============================================ */

export type HomeType = "snippet" | "prompt" | "command" | "note" | "file" | "image" | "link";

/**
 * Sets `--c` to the item type's color so an element can use `text-(--c)`,
 * `bg-(--c)/15`, `border-t-(--c)` and so on. The colors are defined once in
 * `globals.css` (`--color-type-*`).
 */
export const TYPE_ACCENT: Record<HomeType, string> = {
  snippet: "[--c:var(--color-type-snippet)]",
  prompt: "[--c:var(--color-type-prompt)]",
  command: "[--c:var(--color-type-command)]",
  note: "[--c:var(--color-type-note)]",
  file: "[--c:var(--color-type-file)]",
  image: "[--c:var(--color-type-image)]",
  link: "[--c:var(--color-type-link)]",
};

/* ============================================
   Links
   ============================================ */

export interface HomeLink {
  label: string;
  href: string;
}

export const SECTION_LINKS: HomeLink[] = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
];

export const FOOTER_COLUMNS: { title: string; links: HomeLink[] }[] = [
  { title: "Product", links: SECTION_LINKS },
  {
    title: "Account",
    links: [
      { label: "Sign In", href: "/sign-in" },
      { label: "Register", href: "/register" },
    ],
  },
];

/* ============================================
   Chaos panel icons
   ============================================ */

export interface ChaosIcon {
  name: string;
  /** Tailwind text color class (brand-like colors, not item types). */
  color: string;
  /** SVG path data, drawn as 24×24 strokes. */
  paths: string[];
}

export const CHAOS_ICONS: ChaosIcon[] = [
  { name: "Notion", color: "text-zinc-200", paths: ["M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M9 16V8l6 8V8"] },
  {
    name: "GitHub",
    color: "text-zinc-100",
    paths: [
      "M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-.8-2.3c2.8-.3 5.8-1.4 5.8-6.2a4.8 4.8 0 0 0-1.3-3.3 4.5 4.5 0 0 0-.1-3.3s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.1 5.4 2.4 5.4 2.4a4.5 4.5 0 0 0-.1 3.3A4.8 4.8 0 0 0 4 9c0 4.8 3 5.9 5.8 6.2A3 3 0 0 0 9 17.5V21",
    ],
  },
  { name: "Slack", color: "text-fuchsia-400", paths: ["M9 3v12M15 9v12M3 15h12M9 9h12"] },
  { name: "VS Code", color: "text-type-snippet", paths: ["M16 3l5 2.5v13L16 21 6 12z", "M16 3v18M6 12L3 9.5M6 12l-3 2.5"] },
  { name: "Browser tabs", color: "text-amber-500", paths: ["M5 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z", "M3 10h18M7 6V4h5v2M13 6V4h5v2"] },
  { name: "Terminal", color: "text-cyan-500", paths: ["M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "M7 9l3 3-3 3M12 15h5"] },
  { name: "Text file", color: "text-green-500", paths: ["M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z", "M14 3v6h6M8 13h8M8 17h6"] },
  { name: "Bookmarks", color: "text-type-image", paths: ["M6 3h12v18l-6-4-6 4z"] },
];

/* ============================================
   Dashboard preview
   ============================================ */

export const PREVIEW_TYPES: { label: string; type: HomeType }[] = [
  { label: "Snippets", type: "snippet" },
  { label: "Prompts", type: "prompt" },
  { label: "Commands", type: "command" },
  { label: "Notes", type: "note" },
  { label: "Files", type: "file" },
  { label: "Images", type: "image" },
  { label: "Links", type: "link" },
];

export const PREVIEW_CARDS: { title: string; type: HomeType }[] = [
  { title: "useAuth hook", type: "snippet" },
  { title: "Code review", type: "prompt" },
  { title: "git rebase -i", type: "command" },
  { title: "Deploy notes", type: "note" },
  { title: "Arch diagram", type: "image" },
  { title: "Next.js docs", type: "link" },
];

/* ============================================
   Features
   ============================================ */

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  type: HomeType;
}

export const FEATURES: Feature[] = [
  { title: "Code Snippets", description: "Save reusable code with syntax highlighting, language tags and one-click copy.", icon: Code, type: "snippet" },
  { title: "AI Prompts", description: "Keep your best prompts, system messages and context files out of chat history.", icon: Sparkles, type: "prompt" },
  { title: "Instant Search", description: "Press ⌘K and find anything by title, content, tag or type in milliseconds.", icon: Search, type: "link" },
  { title: "Commands", description: "Stop digging through bash history. Store the commands you always forget.", icon: Terminal, type: "command" },
  { title: "Files & Docs", description: "Upload docs, configs and images, and keep them next to the code they explain.", icon: FileText, type: "file" },
  { title: "Collections", description: "Group mixed items into collections like \"React Patterns\" or \"Interview Prep\".", icon: FolderOpen, type: "note" },
];

/* ============================================
   AI section
   ============================================ */

export const AI_CHECKLIST = [
  "AI auto-tag suggestions for every item",
  "One-line summaries of long notes and files",
  "\"Explain This Code\" for any snippet",
  "Prompt optimizer for sharper AI prompts",
];

export const AI_TAGS = ["react", "hooks", "typescript", "debounce", "performance"];

/** k = keyword, f = function, t = type, n = number, p = plain text. */
export type CodeTokenKind = "k" | "f" | "t" | "n" | "p";
export type CodeToken = [CodeTokenKind, string];

export const AI_CODE_FILE = "useDebounce.ts";

export const AI_CODE_LINES: CodeToken[][] = [
  [["k", "export function"], ["p", " "], ["f", "useDebounce"], ["p", "<"], ["t", "T"], ["p", ">(value: "], ["t", "T"], ["p", ", delay = "], ["n", "300"], ["p", ") {"]],
  [["p", "  "], ["k", "const"], ["p", " [debounced, setDebounced] = "], ["f", "useState"], ["p", "(value);"]],
  [],
  [["p", "  "], ["f", "useEffect"], ["p", "(() => {"]],
  [["p", "    "], ["k", "const"], ["p", " id = "], ["f", "setTimeout"], ["p", "(() => "], ["f", "setDebounced"], ["p", "(value), delay);"]],
  [["p", "    "], ["k", "return"], ["p", " () => "], ["f", "clearTimeout"], ["p", "(id);"]],
  [["p", "  }, [value, delay]);"]],
  [],
  [["p", "  "], ["k", "return"], ["p", " debounced;"]],
  [["p", "}"]],
];

/* ============================================
   Pricing
   ============================================ */

export type Billing = "monthly" | "yearly";

export interface PlanPrice {
  amount: string;
  period: string;
  note: string;
}

export const PRO_PRICES: Record<Billing, PlanPrice> = {
  monthly: { amount: "$8", period: "/month", note: "Billed monthly." },
  yearly: { amount: "$72", period: "/year", note: "Billed yearly. That's $6 a month." },
};

export interface Plan {
  name: string;
  features: string[];
  cta: HomeLink;
}

export const FREE_PLAN: Plan & { price: PlanPrice } = {
  name: "Free",
  price: { amount: "$0", period: "/forever", note: "For trying DevStash out." },
  features: ["50 items", "3 collections", "Snippets, prompts, commands, notes and links", "Basic search"],
  cta: { label: "Get Started", href: "/register" },
};

export const PRO_PLAN: Plan = {
  name: "Pro",
  features: [
    "Unlimited items and collections",
    "File and image uploads",
    "AI tagging, summaries and code explanations",
    "Prompt optimizer",
    "Export to JSON or ZIP",
    "Priority support",
  ],
  // Signed-out visitors go through /sign-in?callbackUrl=/upgrade; Pro users are sent on to /settings
  cta: { label: "Upgrade to Pro", href: "/upgrade" },
};
