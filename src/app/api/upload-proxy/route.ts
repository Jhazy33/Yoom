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
    const err = error as Error & { $metadata?: unknown };
    console.error('[Upload Proxy] R2 Upload Error:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      name: err instanceof Error ? err.name : 'Unknown',
      $metadata: "$metadata" in err ? err.$metadata : 'No metadata',
      stack: err instanceof Error ? err.stack : undefined,
      env: {
        bucket: process.env.R2_BUCKET_NAME ? 'set' : 'missing',
        accountId: process.env.R2_ACCOUNT_ID ? 'set' : 'missing',
        accessKey: process.env.R2_ACCESS_KEY_ID ? 'set' : 'missing',
        secretKey: process.env.R2_SECRET_ACCESS_KEY ? 'set' : 'missing',
      }
    });

    let errorMessage = 'Upload failed';
    let errorDetails = 'Unknown error';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.name;

      // Provide actionable error messages
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        errorMessage = 'Cannot connect to R2 storage. Please check your internet connection.';
        errorDetails = 'Network connection failed';
      } else if (error.message.includes('Access Denied') || error.message.includes('403')) {
        errorMessage = 'Permission denied. Check R2 credentials in Vercel environment variables.';
        errorDetails = 'Authentication failed';
      } else if (error.message.includes('NoSuchBucket')) {
        errorMessage = 'R2 bucket not found. Check R2_BUCKET_NAME environment variable.';
        errorDetails = 'Bucket configuration error';
      } else if (error.message.includes('credentials')) {
        errorMessage = 'R2 credentials invalid. Please update environment variables in Vercel.';
        errorDetails = 'Credentials error';
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        originalMessage: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}