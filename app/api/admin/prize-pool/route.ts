import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { prizePoolSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const pool = await prisma.prizePool.findUnique({ where: { id: "singleton" } });
    return NextResponse.json({
      success: true,
      data: pool ?? { totalAmount: 0, currency: "USD", tiers: [], description: null },
    });
  } catch (err) {
    console.error("[admin/prize-pool GET]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const parsed = prizePoolSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { totalAmount, currency, tiers, description } = parsed.data;

    const pool = await prisma.prizePool.upsert({
      where: { id: "singleton" },
      update: {
        totalAmount,
        ...(currency !== undefined && { currency }),
        ...(tiers !== undefined && { tiers }),
        ...(description !== undefined && { description }),
      },
      create: {
        id: "singleton",
        totalAmount,
        currency: currency ?? "USD",
        tiers: tiers ?? [],
        description: description ?? null,
      },
    });

    return NextResponse.json({ success: true, data: pool });
  } catch (err) {
    console.error("[admin/prize-pool PUT]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
