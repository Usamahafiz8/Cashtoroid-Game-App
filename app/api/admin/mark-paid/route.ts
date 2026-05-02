import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { markPaidSchema } from "@/lib/validators";

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

    return NextResponse.json({ success: true, data: { message: "Marked as paid" } });
  } catch (err) {
    console.error("[admin/mark-paid]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
