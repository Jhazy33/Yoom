import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { videoExists, getPublicVideoUrl, getPublicTranscriptUrl } from "@/lib/r2";
import { WatchNavigation } from "@/components/watch-navigation";

interface WatchPageProps {
  params: Promise<{ key: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { key } = await params;

  // Validate key format (should be just UUID for our new structure)
  const videoId = key.replace('.webm', '');

  const exists = await videoExists(videoId);
  if (!exists) {
    notFound();
  }

  const videoUrl = getPublicVideoUrl(videoId);
  const transcriptUrl = getPublicTranscriptUrl(videoId);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = `${baseUrl}/watch/${key}`;

  // Client component wrapper to handle state
  const WatchPageClient = dynamic(() => import('./watch-page-client'), {
    ssr: false,
  });

  return (
    <main className="relative min-h-screen p-8">
      <WatchNavigation />
      <div className="flex gap-8">
        <div className="flex-1">
          <WatchPageClient
            videoUrl={videoUrl}
            transcriptUrl={transcriptUrl}
            shareUrl={shareUrl}
            videoId={videoId}
          />
        </div>
      </div>
    </main>
  );
}
