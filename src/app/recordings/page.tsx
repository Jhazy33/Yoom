"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Sidebar, HamburgerButton } from "@/components/sidebar";

interface RecordingMetadata {
  videoId: string;
  title: string;
  createdAt: string;
  size: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  retryCount?: number;
  hasVideo?: boolean;
  hasMetadata?: boolean;
  r2Key?: string;
}

export default function RecordingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [recordingsError, setRecordingsError] = useState("");
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const handleDeleteRecording = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this recording?")) return;

    try {
      const { deleteVideoFolder } = await import("@/lib/r2");
      await deleteVideoFolder(videoId);
      setRecordings(recordings.filter(r => r.videoId !== videoId));
    } catch (err) {
      console.error("Error deleting recording:", err);
      alert("Failed to delete recording. Please try again.");
    }
  };

  const loadRecordings = async () => {
    try {
      setRecordingsLoading(true);
      setRecordingsError("");

      const response = await fetch("/api/recordings");
      if (!response.ok) throw new Error("Failed to fetch recordings");

      const json = await response.json();
      setRecordings(json.recordings || []);
    } catch (err) {
      console.error("Error loading recordings:", err);
      setRecordingsError("Failed to load recordings");
    } finally {
      setRecordingsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadRecordings();

      // Auto-refresh recordings every 10 seconds
      const interval = setInterval(loadRecordings, 10000);
      return () => clearInterval(interval);
    }
  }, [session]);

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
    router.push("/login");
    return null;
  }

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="absolute top-4 left-4 z-30">
          <HamburgerButton onClick={() => setSidebarOpen(true)} />
        </div>

        <div className="w-full max-w-6xl space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              My Recordings
            </h1>
            <p className="text-muted">
              Manage your screen recordings
            </p>
          </div>

          {recordingsLoading ? (
            <div className="bg-surface border border-border rounded-lg p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <p className="mt-2 text-sm text-muted">Loading recordings...</p>
            </div>
          ) : recordingsError ? (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
              {recordingsError}
            </div>
          ) : recordings.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-8 text-center">
              <p className="text-muted">No recordings found</p>
              <p className="text-sm text-muted mt-2">
                Your recordings will appear here once you upload them.
              </p>
              <a
                href="/recorder"
                className="inline-block mt-4 px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                Start Recording
              </a>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-hover">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recordings.map((recording) => (
                      <tr key={recording.videoId} className="hover:bg-surface-hover">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-foreground">
                            {recording.title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted">
                            {new Date(recording.createdAt).toLocaleDateString()} at{" "}
                            {new Date(recording.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted">
                            {recording.size > 0
                              ? `${(recording.size / 1024 / 1024).toFixed(2)} MB`
                              : "0 B"
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            recording.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                            recording.status === 'uploading' ? 'bg-blue-500/10 text-blue-500' :
                            recording.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                            {recording.status === 'completed' ? '✓ Ready' :
                             recording.status === 'uploading' ? 'Uploading...' :
                             recording.status === 'failed' ? 'Failed' :
                             'Pending'
                            }
                          </span>
                          {recording.retryCount && recording.retryCount > 0 && (
                            <span className="ml-2 text-xs text-muted">
                              (Retry {recording.retryCount})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {recording.status === 'completed' && (
                              <a
                                href={`/watch/${recording.videoId}`}
                                className="px-3 py-1 text-sm bg-accent text-white rounded hover:bg-accent-hover"
                              >
                                Watch
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteRecording(recording.videoId)}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-6">
            <a
              href="/recorder"
              className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
            >
              Start Recording
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
