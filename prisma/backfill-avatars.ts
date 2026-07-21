import { PrismaClient } from "@prisma/client";
import { generateInitialAvatarUrl } from "../lib/avatar";

const prisma = new PrismaClient();

// Assigns a random initial-based avatar to every user that doesn't have one.
// Pass FORCE=1 to overwrite existing avatars too.
async function main() {
  const force = process.env.FORCE === "1";

  const users = await prisma.user.findMany({
    where: force ? {} : { avatarUrl: null },
    select: { id: true, username: true },
  });

  if (users.length === 0) {
    console.log("No users to backfill — everyone already has an avatar.");
    return;
  }

  let updated = 0;
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: generateInitialAvatarUrl(user.username) },
    });
    updated++;
  }

  console.log(`Backfilled avatars for ${updated} user(s)${force ? " (forced)" : ""}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
