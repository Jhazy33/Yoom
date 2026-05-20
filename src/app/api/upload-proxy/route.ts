import { NextRequest, NextResponse } from "next/server";
import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const videoId = formData.get("videoId") as string;

    if (!file || !videoId) {
      return NextResponse.json(
        { error: "Missing file or videoId" },
        { status: 400 }
      );
    }

    console.log(`[Upload Proxy] Starting upload: ${videoId} (${file.size} bytes)`);

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload directly to R2 from server (bypasses CORS)
    const videoKey = `yoom-videos/${videoId}/video.webm`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: videoKey,
      Body: buffer,
      ContentType: "video/webm",
    });

    await r2.send(command);

    console.log(`[Upload Proxy] Success: ${videoKey} (${buffer.length} bytes)`);

    return NextResponse.json({
      success: true,
      key: videoKey,
      videoId
    });

  } catch (error) {
    console.error('[Upload Proxy] Error:', error);

    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}