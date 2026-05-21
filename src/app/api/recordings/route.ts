import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { getUserById } from "@/lib/users";
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

    // List all video folders from R2
    let { folders } = await listVideoFolders();

    // Filter by user permissions (non-admin users only see their folders)
    if (user.role !== 'admin' && user.allowedFolders && user.allowedFolders.length > 0) {
      folders = folders.filter(folder =>
        user.allowedFolders!.some(allowedPath =>
          `yoom-videos/${folder.videoId}/`.startsWith(allowedPath.replace('*', ''))
        )
      );
    }

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

