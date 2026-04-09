import { NextRequest, NextResponse } from "next/server";
import { randomUUID, timingSafeEqual } from "crypto";
import { createPresignedUploadUrl } from "@/lib/r2";

function passwordMatches(input: string, expected: string): boolean {
  if (input.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  const password = request.headers.get("x-upload-password");
  const expected = process.env.UPLOAD_PASSWORD;

  if (!password || !expected || !passwordMatches(password, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = `${randomUUID()}.webm`;
  const presignedUrl = await createPresignedUploadUrl(key);

  return NextResponse.json({ presignedUrl, key });
}
