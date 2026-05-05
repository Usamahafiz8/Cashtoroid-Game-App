import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { token, newPassword } = parsed.data;

    // Decode without verification first to get the userId, then re-verify with full secret
    let userId: string;
    try {
      // Temporarily decode to find user (needed to build the per-user secret)
      const parts = token.split(".");
      if (parts.length !== 3) throw new Error("Invalid token format");
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      userId = payload.sub as string;
      if (!userId) throw new Error("Missing sub");
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Full verification: secret includes current password hash (invalidates used tokens)
    const secret = new TextEncoder().encode(
      (process.env.NEXTAUTH_SECRET ?? "") + user.password
    );

    try {
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    return NextResponse.json({
      success: true,
      data: { message: "Password reset successfully. You can now log in with your new password." },
    });
  } catch (err) {
    console.error("[auth/reset-password]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
