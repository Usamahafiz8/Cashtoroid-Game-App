import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators";
import { sendOtpEmail } from "@/lib/email";

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
        data: { message: "If that email is registered, you will receive an OTP shortly." },
      });
    }

    // Generate 6-digit OTP, expires in 15 minutes
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetOtp: otp, resetOtpExpiry: otpExpiry },
    });

    try {
      await sendOtpEmail({ to: user.email, username: user.username, otp });
    } catch (emailErr) {
      console.error("[auth/forgot-password] Email send failed:", emailErr);
    }

    return NextResponse.json({
      success: true,
      data: { message: "If that email is registered, you will receive an OTP shortly." },
    });
  } catch (err) {
    console.error("[auth/forgot-password]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
