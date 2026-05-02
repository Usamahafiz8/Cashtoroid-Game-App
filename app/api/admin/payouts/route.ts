import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { calculateLeaderboard } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";
import type { PayoutEntry } from "@/types";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);

    const leaderboard = await calculateLeaderboard();
    const top = leaderboard.slice(0, limit);

    const userIds = top.map((e) => e.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, payoutInfo: true, isPaid: true, paidAt: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const payouts: PayoutEntry[] = top.map((entry) => {
      const user = userMap.get(entry.userId)!;
      return {
        ...entry,
        email: user.email,
        payoutInfo: user.payoutInfo ?? null,
        isPaid: user.isPaid,
        paidAt: user.paidAt ?? null,
      };
    });

    return NextResponse.json({ success: true, data: payouts });
  } catch (err) {
    console.error("[admin/payouts]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
