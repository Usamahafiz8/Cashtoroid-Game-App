import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { resetLeaderboard } from "@/lib/leaderboard";
import { leaderboardConfigSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const now = new Date();
    const config = await prisma.leaderboardConfig.findUnique({ where: { id: "singleton" } });

    if (!config) {
      const nextResetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const created = await prisma.leaderboardConfig.create({
        data: { id: "singleton", periodHours: 24, lastResetAt: now, nextResetAt },
      });
      return NextResponse.json({ success: true, data: created });
    }

    return NextResponse.json({ success: true, data: config });
  } catch (err) {
    console.error("[admin/leaderboard/config GET]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const parsed = leaderboardConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { periodHours, triggerReset } = parsed.data;

    if (triggerReset) {
      await resetLeaderboard();
      return NextResponse.json({
        success: true,
        data: { message: "Leaderboard reset and period updated", periodHours },
      });
    }

    const now = new Date();
    const nextResetAt = new Date(now.getTime() + periodHours * 60 * 60 * 1000);

    const config = await prisma.leaderboardConfig.upsert({
      where: { id: "singleton" },
      update: { periodHours, nextResetAt },
      create: { id: "singleton", periodHours, lastResetAt: now, nextResetAt },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (err) {
    console.error("[admin/leaderboard/config PUT]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
