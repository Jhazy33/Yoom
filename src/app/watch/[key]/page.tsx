import { notFound } from "next/navigation";
import { videoExists, getPublicVideoUrl } from "@/lib/r2";
import { VideoPlayer } from "@/components/video-player";

interface WatchPageProps {
  params: Promise<{ key: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { key } = await params;

  // Validate key format (uuid.webm)
  if (!/^[0-9a-f-]+\.webm$/.test(key)) {
    notFound();
  }

  const exists = await videoExists(key);
  if (!exists) {
    notFound();
  }

  const videoUrl = getPublicVideoUrl(key);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/watch/${key}`;

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <VideoPlayer src={videoUrl} shareUrl={shareUrl} />
    </main>
  );
}
