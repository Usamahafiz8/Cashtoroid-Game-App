import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "No file provided. Send a multipart/form-data request with field 'file'." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 5 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(arrayBuffer);
    const { url } = await uploadToCloudinary(buffer, "cashtoroid/avatars", `avatar_${user.id}`);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: url },
      select: { id: true, username: true, avatarUrl: true },
    });

    return NextResponse.json({ success: true, data: { avatarUrl: url, user: updated } });
  } catch (err) {
    console.error("[users/me/avatar/upload]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
