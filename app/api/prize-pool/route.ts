import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await prisma.prizePool.findUnique({ where: { id: "singleton" } });

    if (!pool) {
      return NextResponse.json({
        success: true,
        data: { totalAmount: 0, currency: "USD", tiers: [], description: null },
      });
    }

    return NextResponse.json({ success: true, data: pool });
  } catch (err) {
    console.error("[prize-pool GET]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
