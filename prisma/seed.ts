import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { ContentType, PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SYSTEM_ITEM_TYPES = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
  { name: "link", icon: "Link", color: "#10b981" },
];

const DEMO_USER = {
  email: "demo@devstash.io",
  name: "Demo User",
  password: "12345678",
};

type SeedItemType = "snippet" | "prompt" | "command" | "link";

interface SeedItem {
  type: SeedItemType;
  title: string;
  description: string;
  content?: string;
  url?: string;
  language?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
}

interface SeedCollection {
  name: string;
  description: string;
  isFavorite?: boolean;
  items: SeedItem[];
}

const COLLECTIONS: SeedCollection[] = [
  {
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    isFavorite: true,
    items: [
      {
        type: "snippet",
        title: "useDebounce & useLocalStorage hooks",
        description: "Debounce a changing value and persist state to localStorage",
        language: "typescript",
        isPinned: true,
        isFavorite: true,
        content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}`,
      },
      {
        type: "snippet",
        title: "Context provider & compound components",
        description: "Typed context provider with a compound Tabs component",
        language: "typescript",
        content: `import { createContext, useContext, useState, type ReactNode } from "react";

interface TabsContextValue {
  active: string;
  setActive: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used inside <Tabs>");
  return ctx;
}

export function Tabs({ defaultTab, children }: { defaultTab: string; children: ReactNode }) {
  const [active, setActive] = useState(defaultTab);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}

Tabs.Trigger = function Trigger({ id, children }: { id: string; children: ReactNode }) {
  const { active, setActive } = useTabs();
  return (
    <button aria-selected={active === id} onClick={() => setActive(id)}>
      {children}
    </button>
  );
};

Tabs.Panel = function Panel({ id, children }: { id: string; children: ReactNode }) {
  const { active } = useTabs();
  return active === id ? <div>{children}</div> : null;
};`,
      },
      {
        type: "snippet",
        title: "cn & formatting utilities",
        description: "Class name merging plus date and byte formatting helpers",
        language: "typescript",
        content: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return \`\${(bytes / 1024 ** i).toFixed(decimals)} \${units[i]}\`;
}`,
      },
    ],
  },
  {
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    isFavorite: true,
    items: [
      {
        type: "prompt",
        title: "Code review prompt",
        description: "Thorough review focused on bugs, security and readability",
        isPinned: true,
        content: `You are a senior software engineer reviewing a pull request.

Review the code below and report:
1. Bugs and logic errors (with the exact line and a failing input)
2. Security issues (auth, input validation, injection, secrets)
3. Performance problems (N+1 queries, unnecessary re-renders, wasted work)
4. Readability and naming issues

Rank findings by severity. For each, suggest a concrete fix.
Skip style nits that a linter would catch.

\`\`\`
{{code}}
\`\`\``,
      },
      {
        type: "prompt",
        title: "Documentation generator",
        description: "Generate README-style docs for a module or function",
        isFavorite: true,
        content: `Write documentation for the following code.

Include:
- A one-paragraph overview of what it does and when to use it
- Parameters and return values with types
- At least two usage examples
- Edge cases and errors it can throw

Write for a developer who is new to this codebase. Use Markdown.

\`\`\`
{{code}}
\`\`\``,
      },
      {
        type: "prompt",
        title: "Refactoring assistant",
        description: "Refactor code for clarity without changing behavior",
        content: `Refactor the code below to improve readability and maintainability.

Constraints:
- Do not change external behavior or public APIs
- Keep functions under 50 lines
- Prefer small, well-named helpers over comments
- Remove dead code and duplication

Return the refactored code, then a short bullet list explaining each change.

\`\`\`
{{code}}
\`\`\``,
      },
    ],
  },
  {
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    items: [
      {
        type: "snippet",
        title: "Next.js multi-stage Dockerfile",
        description: "Small production image using Next.js standalone output",
        language: "dockerfile",
        content: `FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]`,
      },
      {
        type: "command",
        title: "Deploy with migrations",
        description: "Apply pending Prisma migrations, then build and start",
        language: "bash",
        content: `npx prisma migrate deploy && npm run build && npm run start`,
      },
      {
        type: "link",
        title: "Docker documentation",
        description: "Official Docker docs and reference",
        url: "https://docs.docker.com/",
      },
      {
        type: "link",
        title: "GitHub Actions documentation",
        description: "Workflows, runners and CI/CD with GitHub Actions",
        url: "https://docs.github.com/en/actions",
      },
    ],
  },
  {
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    items: [
      {
        type: "command",
        title: "Undo last commit (keep changes)",
        description: "Move HEAD back one commit and keep the changes staged",
        language: "bash",
        content: `git reset --soft HEAD~1`,
      },
      {
        type: "command",
        title: "Clean up Docker resources",
        description: "Remove stopped containers, unused networks, images and build cache",
        language: "bash",
        content: `docker system prune -a --volumes`,
      },
      {
        type: "command",
        title: "Kill process on a port",
        description: "Find and kill whatever is listening on port 3000",
        language: "bash",
        isFavorite: true,
        content: `lsof -ti tcp:3000 | xargs kill -9`,
      },
      {
        type: "command",
        title: "Check for outdated packages",
        description: "List outdated dependencies and update within semver ranges",
        language: "bash",
        content: `npm outdated && npm update`,
      },
    ],
  },
  {
    name: "Design Resources",
    description: "UI/UX resources and references",
    items: [
      {
        type: "link",
        title: "Tailwind CSS documentation",
        description: "Utility classes and v4 theme configuration reference",
        url: "https://tailwindcss.com/docs",
        isFavorite: true,
      },
      {
        type: "link",
        title: "shadcn/ui",
        description: "Accessible, copy-paste React components built on Tailwind",
        url: "https://ui.shadcn.com/",
      },
      {
        type: "link",
        title: "Material Design 3",
        description: "Google's open-source design system",
        url: "https://m3.material.io/",
      },
      {
        type: "link",
        title: "Lucide icons",
        description: "Open-source icon library used across DevStash",
        url: "https://lucide.dev/icons/",
      },
    ],
  },
];

const CONTENT_TYPES: Record<SeedItemType, ContentType> = {
  snippet: ContentType.TEXT,
  prompt: ContentType.TEXT,
  command: ContentType.TEXT,
  link: ContentType.URL,
};

async function seedSystemItemTypes() {
  // Postgres treats NULLs as distinct in unique constraints, so upsert on
  // (name, userId = null) isn't possible — check for an existing row instead.
  const typeIds = new Map<string, string>();

  for (const type of SYSTEM_ITEM_TYPES) {
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, userId: null },
    });
    const record =
      existing ?? (await prisma.itemType.create({ data: { ...type, isSystem: true } }));
    typeIds.set(type.name, record.id);
  }

  return typeIds;
}

async function seedDemoUser() {
  // Deleting cascades to the user's items, collections and item-collection joins,
  // so re-running the seed starts from a clean slate.
  await prisma.user.deleteMany({ where: { email: DEMO_USER.email } });

  return prisma.user.create({
    data: {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      password: await bcrypt.hash(DEMO_USER.password, 12),
      isPro: false,
      emailVerified: new Date(),
    },
  });
}

async function seedCollections(userId: string, typeIds: Map<string, string>) {
  for (const collection of COLLECTIONS) {
    await prisma.collection.create({
      data: {
        name: collection.name,
        description: collection.description,
        isFavorite: collection.isFavorite ?? false,
        userId,
        items: {
          create: collection.items.map(({ type, ...item }) => ({
            item: {
              create: {
                ...item,
                contentType: CONTENT_TYPES[type],
                userId,
                itemTypeId: typeIds.get(type)!,
              },
            },
          })),
        },
      },
    });
  }
}

async function main() {
  console.log("Seeding system item types...");
  const typeIds = await seedSystemItemTypes();

  console.log("Seeding demo user...");
  const user = await seedDemoUser();

  console.log("Seeding collections and items...");
  await seedCollections(user.id, typeIds);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
