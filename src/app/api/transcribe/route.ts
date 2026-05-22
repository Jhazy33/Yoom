import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { getUserById } from "@/lib/users";
import { getPublicVideoUrl } from "@/lib/r2";
import { transcribeVideo } from "@/lib/transcription";
import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// POST /api/transcribe - Start transcription for a video
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserById(payload.userId);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    // Get public URL for video
    const videoUrl = getPublicVideoUrl(videoId);

    // Transcribe using Claude
    const transcription = await transcribeVideo(videoUrl);

    // Upload transcript to R2
    const transcriptKey = `yoom-videos/${videoId}/transcript.json`;
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: transcriptKey,
      Body: JSON.stringify(transcription, null, 2),
      ContentType: "application/json",
    });

    await r2.send(command);

    console.log(`[Transcribe] Successfully transcribed and saved ${videoId}`);

    return NextResponse.json({
      success: true,
      videoId,
      transcript: transcription.text.substring(0, 200) + "...", // Preview
    });
  } catch (error) {
    console.error("[Transcribe] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to transcribe video" },
      { status: 500 }
    );
  }
}
