import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { cashoutRequestSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = cashoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { amount, currency, payoutInfo } = parsed.data;

    // Prevent duplicate pending requests
    const existing = await prisma.transaction.findFirst({
      where: { userId: user.id, status: "pending" },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "You already have a pending cashout request" },
        { status: 409 }
      );
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const resolvedPayoutInfo = payoutInfo ?? dbUser?.payoutInfo ?? null;

    if (!resolvedPayoutInfo) {
      return NextResponse.json(
        { success: false, error: "No payout info on file. Please add payment details to your profile." },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        amount,
        currency: currency ?? "USD",
        status: "pending",
        payoutInfo: resolvedPayoutInfo,
      },
    });

    return NextResponse.json(
      { success: true, data: { message: "Cashout request submitted", transactionId: transaction.id } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[cashout/request]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
