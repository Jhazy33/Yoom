import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createPresignedUploadUrl } from "@/lib/r2";

export async function POST(request: NextRequest) {
  const password = request.headers.get("x-upload-password");

  if (!password || password !== process.env.UPLOAD_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = `${randomUUID()}.webm`;
  const presignedUrl = await createPresignedUploadUrl(key);

  return NextResponse.json({ presignedUrl, key });
}
