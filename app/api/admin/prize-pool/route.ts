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
      data: pool ?? { totalAmount: 0, currency: "USD", tiers: [], description: null, viewRate: 0 },
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
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Validation failed",
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const { totalAmount, currency, tiers, description, viewRate } = parsed.data;

    const pool = await prisma.prizePool.upsert({
      where: { id: "singleton" },
      update: {
        totalAmount,
        ...(currency !== undefined && { currency }),
        ...(tiers !== undefined && { tiers }),
        ...(description !== undefined && { description }),
        ...(viewRate !== undefined && { viewRate }),
      },
      create: {
        id: "singleton",
        totalAmount,
        currency: currency ?? "USD",
        tiers: tiers ?? [],
        description: description ?? null,
        viewRate: viewRate ?? 0,
      },
    });

    return NextResponse.json({ success: true, data: pool });
  } catch (err) {
    console.error("[admin/prize-pool PUT]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
