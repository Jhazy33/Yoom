"use client";

interface VideoPlayerProps {
  src: string;
  shareUrl: string;
}

export function VideoPlayer({ src, shareUrl }: VideoPlayerProps) {
  async function copyToClipboard() {
    await navigator.clipboard.writeText(shareUrl);
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      <video
        src={src}
        controls
        autoPlay
        className="w-full rounded-xl border border-neutral-800"
      />
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
          <span className="text-sm text-neutral-400 truncate block">{shareUrl}</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="shrink-0 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
        >
          Copy link
        </button>
      </div>
    </div>
  );
}
