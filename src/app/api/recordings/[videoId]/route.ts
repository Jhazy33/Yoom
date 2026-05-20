import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  deleteVideoFolder,
  getRecordingStatus,
  createPresignedUploadUrl,
  saveMetadata,
  getVideoMetadata,
} from "@/lib/r2";

// DELETE /api/recordings/[videoId] - Delete a recording
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate videoId to prevent path traversal
    if (videoId.includes("..") || videoId.includes("/")) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
    }

    // Check if recording exists
    try {
      await getRecordingStatus(videoId);
    } catch (error) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    // Delete entire folder from R2
    await deleteVideoFolder(videoId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting recording:", error);
    return NextResponse.json(
      { error: "Failed to delete recording" },
      { status: 500 }
    );
  }
}

// POST /api/recordings/[videoId] - Retry failed upload
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate videoId to prevent path traversal
    if (videoId.includes("..") || videoId.includes("/")) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
    }

    // Check if recording exists
    const statusInfo = await getRecordingStatus(videoId);

    // Generate new presigned URL
    const { url } = await createPresignedUploadUrl(videoId);

    // Update metadata with retry count
    const metadata = await getVideoMetadata(videoId);
    if (metadata) {
      await saveMetadata(videoId, {
        ...metadata,
        retryCount: (statusInfo.retryCount || 0) + 1,
        lastRetry: new Date().toISOString(),
      } as any);
    }

    return NextResponse.json({
      presignedUrl: url,
      videoId,
      retryCount: (statusInfo.retryCount || 0) + 1,
    });
  } catch (error) {
    console.error("Error retrying upload:", error);
    return NextResponse.json(
      { error: "Failed to retry upload" },
      { status: 500 }
    );
  }
}