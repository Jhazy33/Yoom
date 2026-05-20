"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Sidebar, HamburgerButton } from "@/components/sidebar";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <a href="/login" className="text-accent hover:underline">Go to login</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        {/* Header with hamburger menu */}
        <div className="absolute top-4 left-4 z-30">
          <HamburgerButton onClick={() => setSidebarOpen(true)} />
        </div>

        <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Welcome to Yoom
          </h1>
          <p className="text-muted">
            Your personal screen recording tool
          </p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Ready to Record</h2>
          <p className="text-muted mb-6">
            Upload your screen recordings and get AI-powered transcription
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm">Secure upload to R2 storage</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-sm">AI transcription with Claude</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="text-sm">Folder-based organization</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-2">Quick Start</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted">
            <li>Upload your screen recording (.webm files)</li>
            <li>Get AI transcription automatically</li>
            <li>Share using the generated link</li>
            <li>View transcripts alongside video</li>
          </ol>
        </div>

        <div className="flex justify-center gap-4">
          <a
            href="/recorder"
            className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            Start Recording
          </a>
          <a
            href="/settings#recordings"
            className="px-6 py-2 bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors"
          >
            Manage Recordings
          </a>
          <a
            href="/settings"
            className="px-6 py-2 bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors"
          >
            Settings
          </a>
          <button
            onClick={handleSignOut}
            className="px-6 py-2 bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
      </main>
    </>
  );
}
