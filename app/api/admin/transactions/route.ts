import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const transactions = await prisma.transaction.findMany({
      where: status ? { status } : {},
      include: {
        user: { select: { id: true, username: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // See app/api/cashout/history/route.ts — reviewedAt covers both approval
    // and rejection, so payoutDate is derived to mean specifically "paid on".
    const data = transactions.map((tx) => ({
      ...tx,
      payoutDate: tx.status === "approved" ? tx.reviewedAt : null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[admin/transactions GET]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
