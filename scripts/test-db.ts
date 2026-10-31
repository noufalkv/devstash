import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const EXPECTED_SYSTEM_TYPES = ["command", "file", "image", "link", "note", "prompt", "snippet"];

const DEMO_EMAIL = "demo@devstash.io";
const DEMO_PASSWORD = "12345678";

// Item type counts per collection, from context/features/seed-spec.md
const EXPECTED_DEMO_COLLECTIONS: Record<string, Record<string, number>> = {
  "React Patterns": { snippet: 3 },
  "AI Workflows": { prompt: 3 },
  DevOps: { snippet: 1, command: 1, link: 2 },
  "Terminal Commands": { command: 4 },
  "Design Resources": { link: 4 },
};

// Thrown inside the CRUD transaction to roll back the test data
class Rollback extends Error {}

async function testConnection() {
  const [{ version }] = await prisma.$queryRaw<{ version: string }[]>`select version()`;
  console.log(`✔ Connected: ${version.split(",")[0]}`);
}

async function testMigrations() {
  const migrations = await prisma.$queryRaw<{ migration_name: string }[]>`
    select migration_name from _prisma_migrations where finished_at is not null order by finished_at`;
  console.log(`✔ Applied migrations (${migrations.length}): ${migrations.map((m) => m.migration_name).join(", ")}`);
}

async function testSystemItemTypes() {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true, userId: null },
    orderBy: { name: "asc" },
  });
  const names = types.map((t) => t.name);
  const missing = EXPECTED_SYSTEM_TYPES.filter((name) => !names.includes(name));

  if (missing.length > 0) {
    throw new Error(`Missing system item types: ${missing.join(", ")} — run npm run db:seed`);
  }
  console.log(`✔ System item types (${types.length}): ${names.join(", ")}`);
}

async function testCounts() {
  const [users, items, collections, tags] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.collection.count(),
    prisma.tag.count(),
  ]);
  console.log(`✔ Row counts: users=${users}, items=${items}, collections=${collections}, tags=${tags}`);
}

async function testDemoUser() {
  const user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });

  if (!user) throw new Error(`Demo user ${DEMO_EMAIL} not found — run npm run db:seed`);
  if (!user.password || !(await bcrypt.compare(DEMO_PASSWORD, user.password))) {
    throw new Error("Demo user password does not match the seeded password");
  }

  console.log(`✔ Demo user: ${user.name} <${user.email}> (isPro=${user.isPro}, verified=${!!user.emailVerified})`);
  return user.id;
}

function countByType(types: string[]) {
  return types.reduce<Record<string, number>>((counts, type) => {
    counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  }, {});
}

function sameCounts(a: Record<string, number>, b: Record<string, number>) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((key) => a[key] === b[key]);
}

interface DemoItem {
  title: string;
  url: string | null;
  language: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  itemType: { name: string };
}

function formatItem(item: DemoItem) {
  const parts = [`    [${item.itemType.name}] ${item.title}`];
  const detail = item.url ?? item.language;
  const flags = [item.isPinned && "pinned", item.isFavorite && "favorite"].filter(Boolean);

  if (detail) parts.push(`(${detail})`);
  if (flags.length > 0) parts.push(`{${flags.join(", ")}}`);
  return parts.join(" ");
}

// Fetches the demo user's collections with their items, prints them and checks them against the spec
async function testDemoData(userId: string) {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      items: { orderBy: { item: { title: "asc" } }, include: { item: { include: { itemType: true } } } },
    },
  });

  console.log(`✔ Demo collections (${collections.length}):`);
  for (const collection of collections) {
    const items = collection.items.map(({ item }) => item);
    console.log(`\n  ${collection.name}${collection.isFavorite ? " ★" : ""} — ${collection.description}`);
    items.forEach((item) => console.log(formatItem(item)));

    const expected = EXPECTED_DEMO_COLLECTIONS[collection.name];
    const actual = countByType(items.map((item) => item.itemType.name));
    if (!expected || !sameCounts(expected, actual)) {
      throw new Error(`Collection "${collection.name}" items ${JSON.stringify(actual)} do not match the spec`);
    }
  }

  const missing = Object.keys(EXPECTED_DEMO_COLLECTIONS).filter((name) => !collections.some((c) => c.name === name));
  if (missing.length > 0) throw new Error(`Missing demo collections: ${missing.join(", ")}`);
  console.log("\n✔ Demo data matches the seed spec");
}

// Creates a user with an item, tag and collection, checks relations, then rolls everything back
async function testCrudRoundTrip() {
  try {
    await prisma.$transaction(async (tx) => {
      const snippetType = await tx.itemType.findFirstOrThrow({
        where: { name: "snippet", isSystem: true, userId: null },
      });

      const user = await tx.user.create({
        data: { email: `test-db-${Date.now()}@devstash.local`, name: "DB Test" },
      });

      const collection = await tx.collection.create({
        data: { name: "Test Collection", userId: user.id, defaultTypeId: snippetType.id },
      });

      const item = await tx.item.create({
        data: {
          title: "Test snippet",
          contentType: "TEXT",
          content: "console.log('hello');",
          language: "typescript",
          userId: user.id,
          itemTypeId: snippetType.id,
          tags: { connectOrCreate: { where: { name: "test-db" }, create: { name: "test-db" } } },
          collections: { create: { collectionId: collection.id } },
        },
        include: { itemType: true, tags: true, collections: { include: { collection: true } } },
      });

      if (
        item.itemType.name !== "snippet" ||
        item.tags.length !== 1 ||
        item.collections[0]?.collection.name !== "Test Collection"
      ) {
        throw new Error("Item relations were not created as expected");
      }

      // Deleting the user should cascade to its items, collections and join rows
      await tx.user.delete({ where: { id: user.id } });
      const [orphanItems, orphanCollections] = await Promise.all([
        tx.item.count({ where: { userId: user.id } }),
        tx.collection.count({ where: { userId: user.id } }),
      ]);

      if (orphanItems !== 0 || orphanCollections !== 0) {
        throw new Error("Cascade delete did not remove the user's items/collections");
      }

      throw new Rollback();
    });
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  }
  console.log("✔ CRUD round trip: create + relations + cascade delete (rolled back)");
}

async function main() {
  console.log("Testing database...\n");

  await testConnection();
  await testMigrations();
  await testSystemItemTypes();
  await testCounts();
  const demoUserId = await testDemoUser();
  await testDemoData(demoUserId);
  await testCrudRoundTrip();

  console.log("\nAll database checks passed!");
}

main()
  .catch((e) => {
    console.error("\n✖ Database test failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
