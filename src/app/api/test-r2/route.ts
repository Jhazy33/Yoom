import { NextRequest, NextResponse } from "next/server";
import { r2 } from "@/lib/r2";
import { HeadBucketCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { folderPath = "yoom-videos", folderPrefix = "" } = body;

    // Test 1: Check bucket access
    const bucketCommand = new HeadBucketCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
    });

    await r2.send(bucketCommand);

    // Test 2: List objects in the configured folder
    const prefix = folderPrefix
      ? `${folderPath}/${folderPrefix}/`
      : `${folderPath}/`;

    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME!,
      Prefix: prefix,
      MaxKeys: 10,
    });

    const listResult = await r2.send(listCommand);

    // Calculate storage usage
    const objects = listResult.Contents || [];
    const totalObjects = objects.length;
    const totalSize = objects.reduce((sum, obj) => sum + (obj.Size || 0), 0);

    return NextResponse.json({
      success: true,
      bucket: process.env.R2_BUCKET_NAME,
      folderPath,
      folderPrefix,
      fullPrefix: prefix,
      storage: {
        objectCount: totalObjects,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      },
      sampleObjects: objects.slice(0, 5).map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
      })),
    });

  } catch (error: any) {
    console.error("R2 test failed:", error);

    let errorMessage = "Failed to connect to R2";
    let details = "";

    if (error.name === "NoSuchBucket") {
      errorMessage = "Bucket not found";
      details = `Bucket "${process.env.R2_BUCKET_NAME}" does not exist or you don't have access`;
    } else if (error.name === "Forbidden" || error.$metadata?.httpStatusCode === 403) {
      errorMessage = "Access denied";
      details = "Check your R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY";
    } else if (error.name === "NoSuchBucket" || error.$metadata?.httpStatusCode === 404) {
      errorMessage = "Bucket not found";
      details = "Verify R2_BUCKET_NAME environment variable";
    } else if (error.message) {
      details = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details,
        config: {
          bucketExists: !!process.env.R2_BUCKET_NAME,
          accountIdExists: !!process.env.R2_ACCOUNT_ID,
          accessKeyExists: !!process.env.R2_ACCESS_KEY_ID,
          secretKeyExists: !!process.env.R2_SECRET_ACCESS_KEY,
          publicUrlExists: !!process.env.R2_PUBLIC_URL,
        },
      },
      { status: 400 }
    );
  }
}
