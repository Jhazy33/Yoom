import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    // Verify current password
    const currentHash = process.env.ADMIN_PASSWORD_HASH;
    if (!currentHash) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const isValid = await compare(currentPassword, currentHash);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Generate new hash
    const newHash = await hash(newPassword, 12);

    // Store new password hash in database or file storage
    // For now, we'll update the environment variable and require manual deployment
    // In production, you'd use Vercel's Environment API or a database

    return NextResponse.json({
      success: true,
      message: "Password hash generated. Please update ADMIN_PASSWORD_HASH in Vercel dashboard.",
      newHash: newHash,
      instructions: [
        "1. Go to Vercel Dashboard > Project > Settings > Environment Variables",
        "2. Find ADMIN_PASSWORD_HASH and update its value to:",
        newHash,
        "3. Click Save and then redeploy your application"
      ]
    });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}