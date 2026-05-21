import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        data: { message: "If that email is registered you will receive a reset link shortly." },
      });
    }

    // Sign with NEXTAUTH_SECRET + current password hash so token invalidates after reset
    const secret = new TextEncoder().encode(
      (process.env.NEXTAUTH_SECRET ?? "") + user.password
    );

    const token = await new SignJWT({ sub: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .setIssuedAt()
      .sign(secret);

    const baseUrl = process.env.NEXTAUTH_URL ?? "https://cashtoroid-game-app-4gcq.vercel.app";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    sendPasswordResetEmail({
      to: user.email,
      username: user.username,
      resetUrl,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: { message: "If that email is registered you will receive a reset link shortly." },
    });
  } catch (err) {
    console.error("[auth/forgot-password]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
