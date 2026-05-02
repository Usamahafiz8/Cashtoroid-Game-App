import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { markPaidSchema } from "@/lib/validators";
import { sendPayoutNotificationEmail } from "@/lib/email";
import { calculateLeaderboard } from "@/lib/leaderboard";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const parsed = markPaidSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { userId } = parsed.data;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isPaid: true, paidAt: new Date() },
    });

    // Non-blocking email notification
    calculateLeaderboard()
      .then((lb) => {
        const entry = lb.find((e) => e.userId === userId);
        return sendPayoutNotificationEmail({
          to: user.email,
          username: user.username,
          totalViews: entry?.totalViews ?? 0,
          rank: entry?.rank ?? 0,
        });
      })
      .catch(() => {});

    return NextResponse.json({ success: true, data: { message: "Marked as paid" } });
  } catch (err) {
    console.error("[admin/mark-paid]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
