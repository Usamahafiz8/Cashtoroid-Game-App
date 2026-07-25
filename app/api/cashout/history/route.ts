import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        payoutInfo: true,
        adminNote: true,
        reviewedAt: true,
        createdAt: true,
      },
    });

    // reviewedAt is set on both approval and rejection, so it can't double as
    // "when this was paid" — payoutDate uses it only for actually-approved
    // (i.e. paid) requests. Pending/rejected requests fall back to createdAt
    // (when the request was initiated) instead of leaving the date blank.
    const data = transactions.map((tx) => ({
      ...tx,
      payoutDate: tx.status === "approved" ? tx.reviewedAt : tx.createdAt,
      // Date-only (YYYY-MM-DD) view of createdAt, independent of status.
      createdDate: tx.createdAt.toISOString().slice(0, 10),
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[cashout/history]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
