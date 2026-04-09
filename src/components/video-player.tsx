"use client";

import { useState } from "react";

interface VideoPlayerProps {
  src: string;
  shareUrl: string;
}

export function VideoPlayer({ src, shareUrl }: VideoPlayerProps) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for insecure contexts
    }
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      <video
        src={src}
        controls
        autoPlay
        className="w-full rounded-xl border border-neutral-800 shadow-lg shadow-black/30"
      />
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-2">
          <span className="text-sm text-neutral-500 truncate block">{shareUrl}</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="shrink-0 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100 transition-all"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
