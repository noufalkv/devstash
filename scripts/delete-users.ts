import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const DEMO_EMAIL = "demo@devstash.io";

// Dry run by default; pass --yes to actually delete.
const confirmed = process.argv.includes("--yes");

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? "").host;
  console.log(`Database: ${host}`);

  const users = await prisma.user.findMany({
    where: { email: { not: DEMO_EMAIL } },
    select: {
      email: true,
      _count: { select: { items: true, collections: true, itemTypes: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (users.length === 0) {
    console.log(`No users other than ${DEMO_EMAIL}. Nothing to delete.`);
    return;
  }

  console.log(`Users to delete (${users.length}):`);
  for (const { email, _count } of users) {
    console.log(`  ${email} — ${_count.items} items, ${_count.collections} collections, ${_count.itemTypes} custom types`);
  }

  if (!confirmed) {
    console.log("\nDry run. Re-run with --yes to delete.");
    return;
  }

  // Cascades remove each user's items, collections, custom types, accounts and sessions.
  const { count } = await prisma.user.deleteMany({ where: { email: { not: DEMO_EMAIL } } });
  await prisma.verificationToken.deleteMany({ where: { identifier: { not: DEMO_EMAIL } } });
  console.log(`\nDeleted ${count} users and their content. ${DEMO_EMAIL} was kept.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
