"use client";

import { useState, useEffect } from "react";
import { YoomLogo } from "./logo";

interface VideoPlayerProps {
  src: string;
  shareUrl: string;
  transcriptUrl?: string;
}

export function VideoPlayer({ src, shareUrl, transcriptUrl }: VideoPlayerProps) {
  const [copied, setCopied] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  // Load transcript when component mounts or transcriptUrl changes
  async function loadTranscript() {
    if (!transcriptUrl) return;
    
    setLoadingTranscript(true);
    try {
      const response = await fetch(transcriptUrl);
      if (response.ok) {
        const data = await response.json();
        setTranscript(data.text);
      }
    } catch (error) {
      console.error('Failed to load transcript:', error);
    } finally {
      setLoadingTranscript(false);
    }
  }

  // Auto-load transcript on mount
  useEffect(() => {
    loadTranscript();
  }, [transcriptUrl]);

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
      <div className="flex justify-center mb-2">
        <YoomLogo size="sm" />
      </div>
      <video
        src={src}
        controls
        autoPlay
        className="w-full rounded-xl border border-border shadow-lg shadow-black/30"
      />
      
      {transcriptUrl && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-sm font-medium text-accent hover:text-accent-hover mb-2 transition-colors"
          >
            {showTranscript ? 'Hide' : 'Show'} Transcript
          </button>
          
          {showTranscript && (
            <div className="mt-2">
              {loadingTranscript ? (
                <p className="text-sm text-muted">Loading transcript...</p>
              ) : transcript ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-sm">{transcript}</p>
                </div>
              ) : (
                <p className="text-sm text-muted italic">No transcript available yet. Check back soon!</p>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg border border-border bg-surface px-3 py-2">
          <span className="text-sm text-muted truncate block">{shareUrl}</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-all"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
