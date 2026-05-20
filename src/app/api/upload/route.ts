import { NextRequest, NextResponse } from "next/server";
import { randomUUID, timingSafeEqual } from "crypto";
import { createPresignedUploadUrl, createVideoFolder } from "@/lib/r2";

function passwordMatches(input: string, expected: string): boolean {
  if (input.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  try {
    // Log environment status (DON'T log secrets!)
    console.log('[Upload API] R2 Config Status:', {
      hasAccountId: !!process.env.R2_ACCOUNT_ID,
      hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
      hasBucket: !!process.env.R2_BUCKET_NAME,
    });

    const password = request.headers.get("x-upload-password");
    const expected = process.env.UPLOAD_PASSWORD;

    // Skip password check if not set (for personal use)
    if (expected && (!password || !passwordMatches(password, expected))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const videoId = randomUUID();
    console.log(`[Upload API] Creating folder for ${videoId}`);

    // Create folder structure in R2
    await createVideoFolder(videoId);

    console.log(`[Upload API] Generating presigned URL for ${videoId}`);
    const { url: presignedUrl, key } = await createPresignedUploadUrl(videoId);

    console.log(`[Upload API] Success - key: ${key}`);

    return NextResponse.json({
      url: presignedUrl,
      key,
      videoId,
      uploadCompleteUrl: `/api/upload-complete/${videoId}`
    });
  } catch (error) {
    console.error('[Upload API] Error:', error);

    let errorMessage = 'Upload failed. Please try again.';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('[Upload API] Stack:', error.stack);
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
