import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        paypalEmail: true,
        payoutInfo: true,
        isPaid: true,
        paidAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Sum of actually-paid-out transactions (the Profile screen's "Lifetime Earnings").
    const paidAgg = await prisma.transaction.aggregate({
      where: { userId, status: "approved" },
      _sum: { amount: true },
    });

    return NextResponse.json({
      success: true,
      data: { ...user, lifetimeEarnings: paidAgg._sum.amount ?? 0 },
    });
  } catch (err) {
    console.error("[users/me GET]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.id;
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { username, email, paypalEmail, payoutInfo } = parsed.data;

    // Check uniqueness of username/email if being changed
    if (username || email) {
      const conflict = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            { OR: [...(username ? [{ username }] : []), ...(email ? [{ email }] : [])] },
          ],
        },
      });
      if (conflict) {
        return NextResponse.json(
          { success: false, error: "Username or email already taken" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username !== undefined ? { username } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(paypalEmail !== undefined ? { paypalEmail } : {}),
        ...(payoutInfo !== undefined ? { payoutInfo } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        paypalEmail: true,
        payoutInfo: true,
        isPaid: true,
        paidAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[users/me PUT]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
