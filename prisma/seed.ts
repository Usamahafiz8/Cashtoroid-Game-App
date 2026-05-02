import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@cashtoroid.com";
  const adminHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      username: "admin",
      email: adminEmail,
      password: adminHash,
      role: "admin",
    },
  });

  const testUsers = [
    { username: "player1", email: "user1@test.com" },
    { username: "player2", email: "user2@test.com" },
    { username: "player3", email: "user3@test.com" },
  ];

  const userHash = await bcrypt.hash("password123", 10);

  for (const [i, u] of testUsers.entries()) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: userHash, role: "user" },
    });

    await prisma.video.createMany({
      skipDuplicates: true,
      data: [
        {
          userId: user.id,
          platform: "youtube",
          url: `https://www.youtube.com/watch?v=seed_approved_${i}_1`,
          title: `${u.username} Gameplay #1`,
          currentViews: (i + 1) * 10000,
          status: "approved",
          lastCheckedAt: new Date(),
        },
        {
          userId: user.id,
          platform: "youtube",
          url: `https://www.youtube.com/watch?v=seed_approved_${i}_2`,
          title: `${u.username} Gameplay #2`,
          currentViews: (i + 1) * 5000,
          status: "approved",
          lastCheckedAt: new Date(),
        },
        {
          userId: user.id,
          platform: "tiktok",
          url: `https://www.tiktok.com/@${u.username}/video/seed_pending_${i}`,
          title: `${u.username} TikTok Clip`,
          currentViews: 0,
          status: "pending",
        },
      ],
    });
  }

  console.log("Seed complete. Admin:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
