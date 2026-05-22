"use client";

import { useState, useEffect } from "react";
import { VideoPlayer } from "@/components/video-player";
import { VideoChat } from "@/components/video-chat";
import { HomeIconButton } from "@/components/home-icon-button";

interface WatchPageClientProps {
  videoUrl: string;
  transcriptUrl?: string;
  shareUrl: string;
  videoId: string;
}

export function WatchPageClient({ videoUrl, transcriptUrl, shareUrl, videoId }: WatchPageClientProps) {
  const [transcript, setTranscript] = useState<string | null>(null);

  // Load transcript and share with chat component
  useEffect(() => {
    async function loadTranscript() {
      if (!transcriptUrl) return;
      try {
        const response = await fetch(transcriptUrl);
        if (response.ok) {
          const data = await response.json();
          setTranscript(data.text);
        }
      } catch (error) {
        console.error('Failed to load transcript:', error);
      }
    }
    loadTranscript();
  }, [transcriptUrl]);

  return (
    <>
      <div className="absolute top-4 right-4 z-10">
        <HomeIconButton />
      </div>
      <div className="flex gap-8 mt-16">
        <div className="flex-1">
          <VideoPlayer
            src={videoUrl}
            transcriptUrl={transcriptUrl}
            shareUrl={shareUrl}
            videoId={videoId}
          />
        </div>
        <div className="w-96">
          <VideoChat videoId={videoId} transcript={transcript} />
        </div>
      </div>
    </>
  );
}
