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
    // "when this was paid" — payoutDate is only set for actually-approved
    // (i.e. paid) requests, null otherwise.
    const data = transactions.map((tx) => ({
      ...tx,
      payoutDate: tx.status === "approved" ? tx.reviewedAt : null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[cashout/history]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
