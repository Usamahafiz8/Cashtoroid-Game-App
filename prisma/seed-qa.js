/**
 * One-off QA seed. Additive only — creates/refreshes a single test user
 * (qa.tester@cashtoroid.com) and data owned by that user. Touches no other row
 * except the global PrizePool.viewRate.
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const EMAIL = "qa.tester@cashtoroid.com";
const USERNAME = "qatester";
const PASSWORD = "Test1234!";

const AVATAR = "https://ui-avatars.com/api/?name=Q&background=3a86ff&color=ffffff&size=128&bold=true&font-size=0.5";

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      password: hash,
      paypalEmail: "qa.payouts@cashtoroid.com",
      payoutInfo: "PayPal — QA Tester",
      avatarUrl: AVATAR,
    },
    create: {
      username: USERNAME,
      email: EMAIL,
      password: hash,
      role: "user",
      avatarUrl: AVATAR,
      paypalEmail: "qa.payouts@cashtoroid.com",
      payoutInfo: "PayPal — QA Tester",
      isPaid: false,
    },
  });

  // Wipe only this user's own rows so re-runs are idempotent.
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.video.deleteMany({ where: { userId: user.id } });
  await prisma.tikTokAccount.deleteMany({ where: { userId: user.id } });

  // Covers every status the UI branches on. baseViews < currentViews so the
  // delta-scored leaderboard has something to rank.
  //
  // Every YouTube/TikTok URL below is a real, public, currently-live video,
  // confirmed via each platform's oEmbed endpoint; titles are the real titles
  // so the label matches what the link opens. Real IDs matter beyond the link
  // rendering: fetchYouTubeViews() in lib/youtube.ts returns -1 for an ID the
  // API can't resolve, so a made-up ID breaks view-syncing too.
  await prisma.video.createMany({
    data: [
      {
        userId: user.id,
        platform: "youtube",
        url: "https://www.youtube.com/watch?v=o9v5VhkZxKc",
        title: "5 Minute Sit-Up Workout",
        currentViews: 128_400,
        baseViews: 40_000,
        status: "approved",
        lastCheckedAt: daysAgo(0),
        createdAt: daysAgo(12),
      },
      {
        userId: user.id,
        platform: "youtube",
        url: "https://www.youtube.com/watch?v=UCjNb0nTn10",
        title: "10 Minute Sit-Up Challenge Workout Sydney Cummings",
        currentViews: 64_250,
        baseViews: 21_000,
        status: "approved",
        lastCheckedAt: daysAgo(0),
        createdAt: daysAgo(9),
      },
      {
        userId: user.id,
        platform: "tiktok",
        url: "https://www.tiktok.com/@chase.me.03/video/7484405506459716907",
        title: "The sit-ups were diabolical 😤 #fitness",
        currentViews: 18_900,
        baseViews: 3_500,
        status: "approved",
        lastCheckedAt: daysAgo(1),
        createdAt: daysAgo(5),
      },
      {
        userId: user.id,
        platform: "youtube",
        url: "https://www.youtube.com/watch?v=-HusJ8P4k-4",
        title: "50 Sit Ups Home Ab Workout – Calisthenics for beginners – NO EQUIPMENT",
        currentViews: 0,
        baseViews: 0,
        status: "pending",
        createdAt: daysAgo(2),
      },
      {
        userId: user.id,
        platform: "tiktok",
        url: "https://www.tiktok.com/@alex_fit_healthy/video/7266768808226934049",
        title: "Sit Up Challenge: Variations and Techniques for Stronger Abs",
        currentViews: 0,
        baseViews: 0,
        status: "pending",
        createdAt: daysAgo(1),
      },
      {
        userId: user.id,
        platform: "youtube",
        url: "https://www.youtube.com/watch?v=-m-EUZGo_m0",
        title: "15 Best Ways To Do Sit-Ups (EASIEST TO HARDEST)",
        currentViews: 4_100,
        baseViews: 0,
        status: "rejected",
        isFlagged: true,
        flagReason: "Video does not show the challenge being performed.",
        lastCheckedAt: daysAgo(3),
        createdAt: daysAgo(7),
      },
      {
        userId: user.id,
        platform: "tiktok",
        url: "https://www.tiktok.com/@ian.gunther/video/7488119826540416298",
        title: "Is the impossible sit up challenge actually impossible? 🤔",
        currentViews: 31_000,
        baseViews: 12_000,
        status: "approved",
        isFlagged: true,
        flagReason: "View count spiked unusually fast — needs a second look.",
        lastCheckedAt: daysAgo(0),
        createdAt: daysAgo(4),
      },
      // Instagram is the one platform whose URL could NOT be verified: it serves
      // a login wall to unauthenticated requests (same reason lib/scraper.ts
      // treats IG as manual-views-only). Left pending and kept out of the
      // approved/earnings math so nothing downstream depends on it resolving.
      {
        userId: user.id,
        platform: "instagram",
        url: "https://www.instagram.com/fullytappedfitness/reel/C90TtJrp2qG/",
        title: "Workout Wednesday Challenge: GHD Sit-Ups (Instagram — unverified)",
        currentViews: 0,
        baseViews: 0,
        status: "pending",
        createdAt: daysAgo(3),
      },
    ],
  });

  // Payout history. Deliberately NO pending row: cashout/request 409s when one
  // exists, and you'll want to test submitting a fresh request.
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        amount: 75.0,
        currency: "USD",
        status: "approved",
        paypalEmail: "qa.payouts@cashtoroid.com",
        payoutInfo: "PayPal — QA Tester",
        adminNote: "Paid out in the week 1 batch.",
        reviewedBy: "admin@cashtoroid.com",
        reviewedAt: daysAgo(20),
        createdAt: daysAgo(22),
      },
      {
        userId: user.id,
        amount: 40.5,
        currency: "USD",
        status: "approved",
        paypalEmail: "qa.payouts@cashtoroid.com",
        payoutInfo: "PayPal — QA Tester",
        adminNote: "Paid out in the week 2 batch.",
        reviewedBy: "admin@cashtoroid.com",
        reviewedAt: daysAgo(11),
        createdAt: daysAgo(13),
      },
      {
        userId: user.id,
        amount: 500.0,
        currency: "USD",
        status: "rejected",
        paypalEmail: "qa.payouts@cashtoroid.com",
        payoutInfo: "PayPal — QA Tester",
        adminNote: "Requested amount exceeded the available balance.",
        reviewedBy: "admin@cashtoroid.com",
        reviewedAt: daysAgo(6),
        createdAt: daysAgo(8),
      },
    ],
  });

  await prisma.prizePool.update({
    where: { id: "singleton" },
    data: { viewRate: 0.5 },
  });

  const videos = await prisma.video.findMany({ where: { userId: user.id } });
  const approved = videos.filter((v) => v.status === "approved");
  const deltaViews = approved.reduce((s, v) => s + Math.max(0, v.currentViews - v.baseViews), 0);
  const totalViews = approved.reduce((s, v) => s + v.currentViews, 0);

  console.log("user id:      ", user.id);
  console.log("email:        ", EMAIL);
  console.log("password:     ", PASSWORD);
  console.log("videos:       ", videos.length, `(${approved.length} approved)`);
  console.log("leaderboard views (delta):", deltaViews.toLocaleString());
  console.log("my-videos earnings @0.50/1k:", "$" + ((totalViews / 1000) * 0.5).toFixed(2));
  console.log("lifetime earnings (approved tx):", "$115.50");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
