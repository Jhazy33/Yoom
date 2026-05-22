import { S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function validateR2Connection(): Promise<boolean> {
  try {
    const { HeadBucketCommand } = await import("@aws-sdk/client-s3");
    const command = new HeadBucketCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
    });
    await r2.send(command);
    console.log('[R2] Connection validated successfully');
    return true;
  } catch (error) {
    console.error('[R2] Connection validation failed:', error);
    return false;
  }
}

export interface VideoMetadata {
  title: string;
  createdAt: string;
  size: number;
  type: string;
  duration: number;
  transcription?: {
    text: string;
    timestamp: string;
    model: string;
  };
}

// Folder-based file organization
export async function createVideoFolder(videoId: string) {
  const metadataCommand = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: `yoom-videos/${videoId}/.metadata`,
  });
  
  await r2.send(metadataCommand);
}

export async function uploadVideo(videoId: string, videoBlob: Blob, metadata: VideoMetadata) {
  const videoKey = `yoom-videos/${videoId}/video.webm`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: videoKey,
    Body: videoBlob,
    ContentType: "video/webm",
    Metadata: {
      title: metadata.title,
      createdAt: metadata.createdAt,
      size: metadata.size.toString(),
    },
  });

  await r2.send(command);
  return videoKey;
}

export async function saveTranscript(videoId: string, transcription: Record<string, unknown>) {
  const transcriptKey = `yoom-videos/${videoId}/transcript.json`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: transcriptKey,
    Body: JSON.stringify(transcription, null, 2),
    ContentType: "application/json",
  });

  await r2.send(command);
  return transcriptKey;
}

export async function saveMetadata(videoId: string, metadata: VideoMetadata) {
  const metadataKey = `yoom-videos/${videoId}/metadata.json`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: metadataKey,
    Body: JSON.stringify(metadata, null, 2),
    ContentType: "application/json",
  });

  await r2.send(command);
  return metadataKey;
}

export async function getVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
  try {
    const metadataKey = `yoom-videos/${videoId}/metadata.json`;
    const command = new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: metadataKey,
    });

    const response = await r2.send(command);
    return response.Metadata as unknown as VideoMetadata;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}

export async function createPresignedUploadUrl(videoId: string): Promise<{url: string, key: string}> {
  const videoKey = `yoom-videos/${videoId}/video.webm`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: videoKey,
    ContentType: "video/webm",
  });

  const url = await getSignedUrl(r2, command, { expiresIn: 600 });
  return { url, key: videoKey };
}

export async function videoExists(videoId: string): Promise<boolean> {
  try {
    await r2.send(
      new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: `yoom-videos/${videoId}/video.webm`,
      })
    );
    return true;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "NotFound") return false;
    if (err instanceof Error && "$$metadata" in err) {
      const meta = err as Error & { $$metadata: { httpStatusCode?: number } };
      if (meta.$$metadata.httpStatusCode === 404) return false;
    }
    throw err;
  }
}

export function getPublicVideoUrl(videoId: string): string {
  return `${process.env.R2_PUBLIC_URL}/yoom-videos/${videoId}/video.webm`;
}

export function getPublicTranscriptUrl(videoId: string): string {
  return `${process.env.R2_PUBLIC_URL}/yoom-videos/${videoId}/transcript.json`;
}

export async function listVideoFolders(continuationToken?: string): Promise<{
  folders: Array<{videoId: string; lastModified: Date}>;
  nextToken?: string;
}> {
  const command = new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET_NAME!,
    Prefix: "yoom-videos/",
    Delimiter: "/",
    ContinuationToken: continuationToken,
  });

  const response = await r2.send(command);

  const folders = (response.CommonPrefixes || []).map(prefix => {
    const videoId = prefix.Prefix?.replace("yoom-videos/", "").replace("/", "") || "";
    return {
      videoId,
      lastModified: prefix.Prefix ? new Date() : new Date(),
    };
  });

  return {
    folders,
    nextToken: response.NextContinuationToken,
  };
}

export async function deleteVideoFolder(videoId: string): Promise<void> {
  // First, list all objects in the folder
  const listCommand = new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET_NAME!,
    Prefix: `yoom-videos/${videoId}/`,
  });

  const listResponse = await r2.send(listCommand);

  if (!listResponse.Contents || listResponse.Contents.length === 0) {
    throw new Error("Video folder not found");
  }

  // Delete all objects
  const deleteCommand = new DeleteObjectsCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Delete: {
      Objects: listResponse.Contents.map(obj => ({ Key: obj.Key! })),
      Quiet: false,
    },
  });

  await r2.send(deleteCommand);
}

export async function getRecordingStatus(videoId: string): Promise<{
  status: "complete" | "uploading" | "failed";
  size: number;
  hasVideo: boolean;
  hasMetadata: boolean;
  retryCount?: number;
}> {
  try {
    // Check for video file
    const videoCommand = new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: `yoom-videos/${videoId}/video.webm`,
    });

    let hasVideo = false;
    let videoSize = 0;

    try {
      const videoResponse = await r2.send(videoCommand);
      hasVideo = true;
      videoSize = videoResponse.ContentLength || 0;
    } catch (err) {
      hasVideo = false;
    }

    // Check for metadata
    const metadataCommand = new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: `yoom-videos/${videoId}/metadata.json`,
    });

    let hasMetadata = false;
    let retryCount = 0;
    let metadataSize = 0;

    try {
      const metadataResponse = await r2.send(metadataCommand);
      hasMetadata = true;
      metadataSize = metadataResponse.ContentLength || 0;
      retryCount = parseInt(metadataResponse.Metadata?.["retry-count"] || "0");
    } catch (err) {
      hasMetadata = false;
    }

    // Determine status
    let status: "complete" | "uploading" | "failed" = "uploading";

    if (hasVideo && hasMetadata) {
      status = "complete";
    } else if (hasMetadata && !hasVideo && retryCount > 0) {
      status = "failed";
    }

    return {
      status,
      size: videoSize + metadataSize,
      hasVideo,
      hasMetadata,
      retryCount,
    };
  } catch (error) {
    console.error('Error checking recording status:', error);
    throw error;
  }
}