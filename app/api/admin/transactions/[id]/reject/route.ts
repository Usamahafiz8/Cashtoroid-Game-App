import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { transactionReviewSchema } from "@/lib/validators";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const admin = await getAuthUser();
    const body = await req.json().catch(() => ({}));
    const parsed = transactionReviewSchema.safeParse(body);

    const transaction = await prisma.transaction.findUnique({ where: { id: params.id } });
    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    if (transaction.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Transaction is not pending" },
        { status: 400 }
      );
    }

    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        status: "rejected",
        adminNote: parsed.success ? (parsed.data.adminNote ?? null) : null,
        reviewedBy: admin?.id ?? null,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Transaction rejected", transaction: updated },
    });
  } catch (err) {
    console.error("[admin/transactions/[id]/reject]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
