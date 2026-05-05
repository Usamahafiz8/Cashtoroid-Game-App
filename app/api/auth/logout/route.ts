import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not logged in" },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    // Clear all NextAuth session cookies
    for (const name of [
      "authjs.session-token",
      "__Secure-authjs.session-token",
      "authjs.csrf-token",
      "__Host-authjs.csrf-token",
      "authjs.callback-url",
    ]) {
      cookieStore.delete(name);
    }

    return NextResponse.json({
      success: true,
      data: { message: "Logged out successfully" },
    });
  } catch (err) {
    console.error("[auth/logout]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
