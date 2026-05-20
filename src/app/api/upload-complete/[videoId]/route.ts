import { NextRequest, NextResponse } from "next/server";
import { saveMetadata, saveTranscript, getPublicVideoUrl } from "@/lib/r2";
import { transcribeVideo, generateMetadata } from "@/lib/transcription";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  const body = await request.json();
  const { title, size, type } = body;

  try {
    // Generate metadata
    const metadata = await generateMetadata(
      new Blob([], { type: type || "video/webm" }),
      title
    );
    
    // Save metadata to R2
    await saveMetadata(videoId, metadata);

    // Trigger transcription (async, don't wait)
    const publicVideoUrl = getPublicVideoUrl(videoId);
    transcribeVideo(publicVideoUrl)
      .then(transcription => {
        // Save transcript when complete
        saveTranscript(videoId, {
          text: transcription.text,
          metadata: {
            ...transcription.metadata,
            timestamp: new Date().toISOString()
          }
        });
      })
      .catch(error => {
        console.error('Transcription failed:', error);
      });

    return NextResponse.json({ 
      success: true,
      videoId,
      watchUrl: `/watch/${videoId}`,
      publicUrl: publicVideoUrl
    });

  } catch (error) {
    console.error('Upload completion error:', error);
    return NextResponse.json({ 
      error: 'Failed to process upload' 
    }, { status: 500 });
  }
}
