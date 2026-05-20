import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listVideoFolders,
  getRecordingStatus,
  createPresignedUploadUrl,
  saveMetadata,
  getVideoMetadata,
} from "@/lib/r2";

// GET /api/recordings - List all recordings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // List all video folders from R2
    const { folders } = await listVideoFolders();

    // Get detailed status for each recording
    const recordings = await Promise.all(
      folders.map(async ({ videoId, lastModified }) => {
        try {
          const statusInfo = await getRecordingStatus(videoId);
          const metadata = await getVideoMetadata(videoId);

          return {
            videoId,
            title: metadata?.title || videoId,
            size: statusInfo.size,
            createdAt: metadata?.createdAt || lastModified.toISOString(),
            status: statusInfo.status === "complete" ? "completed" : statusInfo.status,
            retryCount: statusInfo.retryCount || 0,
            hasVideo: statusInfo.hasVideo,
            hasMetadata: statusInfo.hasMetadata,
            r2Key: `yoom-videos/${videoId}/video.webm`,
          };
        } catch (recordingError) {
          // If individual recording fails, return basic info
          console.error(`Error loading recording ${videoId}:`, recordingError);
          return {
            videoId,
            title: videoId,
            size: 0,
            createdAt: lastModified.toISOString(),
            status: "failed" as const,
            retryCount: 0,
            hasVideo: false,
            hasMetadata: false,
            r2Key: `yoom-videos/${videoId}/video.webm`,
          };
        }
      })
    );

    return NextResponse.json({ recordings });
  } catch (error) {
    console.error("Error listing recordings:", error);
    // Return empty recordings array on any error
    return NextResponse.json({ recordings: [] });
  }
}

