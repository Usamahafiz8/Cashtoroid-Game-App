import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtpSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account found with this email" },
        { status: 400 }
      );
    }

    if (!user.resetOtp || !user.resetOtpExpiry) {
      return NextResponse.json(
        { success: false, error: "No OTP was requested for this account. Please request a password reset first." },
        { status: 400 }
      );
    }

    if (new Date() > user.resetOtpExpiry) {
      return NextResponse.json(
        { success: false, error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (user.resetOtp !== otp) {
      return NextResponse.json(
        { success: false, error: "Incorrect OTP" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "OTP verified successfully." },
    });
  } catch (err) {
    console.error("[auth/verify-otp]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
