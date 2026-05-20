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

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordHash, setPasswordHash] = useState("");
  const [instructions, setInstructions] = useState<string[]>([]);
  const [storageStats, setStorageStats] = useState<any>(null);

  // Recordings state
  const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [recordingsError, setRecordingsError] = useState("");
  const [retryingVideoId, setRetryingVideoId] = useState<string | null>(null);

  // R2 Configuration state
  const [r2Config, setR2Config] = useState({
    folderPath: "yoom-videos",
    folderPrefix: "",
  });
  const [r2TestResult, setR2TestResult] = useState<any>(null);
  const [testingR2, setTestingR2] = useState(false);
  const [r2Error, setR2Error] = useState("");

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    // Validation
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to change password");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Store the new hash and instructions for display
      if (data.newHash) {
        setPasswordHash(data.newHash);
        setInstructions(data.instructions);
      }

      // Sign out after 10 seconds to give user time to copy the hash
      setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, 10000);
    } catch (err) {
      setError("Failed to change password. Please try again.");
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Load recordings on mount
  useEffect(() => {
    const loadRecordings = async () => {
      try {
        setRecordingsLoading(true);
        setRecordingsError("");
        const res = await fetch("/api/recordings");
        if (!res.ok) throw new Error("Failed to fetch recordings");
        const json = await res.json();
        setRecordings(json.recordings || []);
      } catch (err) {
        setRecordingsError("Failed to load recordings");
        console.error("Error loading recordings:", err);
      } finally {
        setRecordingsLoading(false);
      }
    };

    loadRecordings();
  }, []);

  // Handle recording deletion
  const handleDeleteRecording = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this recording?")) return;

    try {
      const { deleteRecording } = await import("@/lib/storage");
      await deleteRecording(videoId);
      setRecordings(recordings.filter(r => r.videoId !== videoId));
    } catch (err) {
      alert("Failed to delete recording");
      console.error("Error deleting recording:", err);
    }
  };

  // Handle recording retry
  const handleRetryRecording = async (videoId: string) => {
    try {
      setRetryingVideoId(videoId);

      // Update status to uploading
      setRecordings(recordings.map(r =>
        r.videoId === videoId ? { ...r, status: 'uploading' as const } : r
      ));

      // Call retry API
      const retryRes = await fetch(`/api/recordings/${videoId}/retry`, {
        method: "POST",
      });

      if (!retryRes.ok) {
        throw new Error("Failed to retry upload");
      }

      // Refresh recordings
      const res = await fetch("/api/recordings");
      const json = await res.json();
      setRecordings(json.recordings || []);
    } catch (err) {
      alert("Failed to retry upload");
      setRecordings(recordings.map(r =>
        r.videoId === videoId ? { ...r, status: 'failed' as const } : r
      ));
      console.error("Error retrying recording:", err);
    } finally {
      setRetryingVideoId(null);
    }
  };

  // Handle recording download
  const handleDownloadRecording = async (recording: RecordingMetadata) => {
    if (!recording.r2Key) {
      alert("This recording is not available for download");
      return;
    }

    try {
      // Assuming R2 public URL pattern - adjust based on your setup
      const downloadUrl = `/api/recordings/${recording.videoId}/download`;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = recording.title || 'recording.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to download recording");
      console.error("Error downloading recording:", err);
    }
  };

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: RecordingMetadata['status']): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 border-yellow-500 text-yellow-500';
      case 'uploading': return 'bg-blue-500/10 border-blue-500 text-blue-500';
      case 'completed': return 'bg-green-500/10 border-green-500 text-green-500';
      case 'failed': return 'bg-red-500/10 border-red-500 text-red-500';
      default: return 'bg-gray-500/10 border-gray-500 text-gray-500';
    }
  };

  // Load storage stats on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const { getStorageStats } = await import("@/lib/storage");
        const stats = await getStorageStats();
        setStorageStats(stats);
      } catch (err) {
        console.error("Failed to load storage stats:", err);
      }
    };
    loadStats();
  }, []);

  const validateFolderName = (name: string): boolean => {
    return /^[a-zA-Z0-9-_]+$/.test(name);
  };

  const handleTestR2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setR2Error("");
    setR2TestResult(null);
    setTestingR2(true);

    // Validation
    if (!r2Config.folderPath.trim()) {
      setR2Error("Folder path is required");
      setTestingR2(false);
      return;
    }

    if (!validateFolderName(r2Config.folderPath)) {
      setR2Error("Folder path can only contain letters, numbers, hyphens, and underscores");
      setTestingR2(false);
      return;
    }

    if (r2Config.folderPrefix && !validateFolderName(r2Config.folderPrefix)) {
      setR2Error("Folder prefix can only contain letters, numbers, hyphens, and underscores");
      setTestingR2(false);
      return;
    }

    try {
      const res = await fetch("/api/test-r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(r2Config),
      });

      const data = await res.json();

      if (!res.ok) {
        setR2Error(data.error || "Failed to test R2 connection");
        setTestingR2(false);
        return;
      }

      setR2TestResult(data);
    } catch (err) {
      setR2Error("Failed to test R2 connection. Please try again.");
    } finally {
      setTestingR2(false);
    }
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="min-h-screen flex items-center justify-center bg-surface p-8">
        {/* Header with hamburger menu */}
        <div className="absolute top-4 left-4 z-30">
          <HamburgerButton onClick={() => setSidebarOpen(true)} />
        </div>

        <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted mt-2">Manage your account</p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>

            {success ? (
              <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded">
                <p className="font-semibold mb-2">Password hash generated successfully!</p>
                <p className="text-sm mb-4">Follow these steps to complete the update:</p>
                <ol className="list-decimal list-inside text-sm space-y-1 mb-3">
                  <li>Copy the hash below</li>
                  <li>Go to Vercel Dashboard → Project → Settings → Environment Variables</li>
                  <li>Update ADMIN_PASSWORD_HASH with the new value</li>
                  <li>Click Save</li>
                  <li>Redeploy your application</li>
                </ol>
                <div className="mt-3 p-2 bg-black/20 rounded">
                  <p className="text-xs mb-1">New Password Hash (click to copy):</p>
                  <code
                    className="text-xs break-all cursor-pointer hover:text-green-400"
                    onClick={() => navigator.clipboard.writeText(passwordHash)}
                  >
                    {passwordHash}
                  </code>
                </div>
                <p className="text-xs mt-3">You will be signed out in 10 seconds.</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="current" className="block text-sm font-medium text-foreground mb-2">
                    Current Password
                  </label>
                  <input
                    id="current"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label htmlFor="new" className="block text-sm font-medium text-foreground mb-2">
                    New Password
                  </label>
                  <input
                    id="new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Enter new password (min 8 characters)"
                  />
                </div>

                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-foreground mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Updating..." : "Change Password"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* R2 Storage Configuration */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">R2 Storage Settings</h2>

          <form onSubmit={handleTestR2} className="space-y-4">
            {r2Error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
                {r2Error}
              </div>
            )}

            {r2TestResult?.success && (
              <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded">
                <p className="font-semibold mb-2">✓ R2 Connection Successful!</p>
                <div className="text-sm space-y-1">
                  <p>Bucket: <code className="bg-black/20 px-1 rounded">{r2TestResult.bucket}</code></p>
                  <p>Folder: <code className="bg-black/20 px-1 rounded">{r2TestResult.fullPrefix}</code></p>
                  <p>Objects: {r2TestResult.storage.objectCount}</p>
                  <p>Total Size: {r2TestResult.storage.totalSizeMB} MB</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="folderPath" className="block text-sm font-medium text-foreground mb-2">
                Folder Path
              </label>
              <input
                id="folderPath"
                type="text"
                value={r2Config.folderPath}
                onChange={(e) => setR2Config({ ...r2Config, folderPath: e.target.value })}
                required
                pattern="[a-zA-Z0-9-_]+"
                className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="yoom-videos"
              />
              <p className="text-xs text-muted mt-1">
                Base folder name in R2 bucket (letters, numbers, hyphens, underscores only)
              </p>
            </div>

            <div>
              <label htmlFor="folderPrefix" className="block text-sm font-medium text-foreground mb-2">
                Folder Prefix (Optional)
              </label>
              <input
                id="folderPrefix"
                type="text"
                value={r2Config.folderPrefix}
                onChange={(e) => setR2Config({ ...r2Config, folderPrefix: e.target.value })}
                pattern="[a-zA-Z0-9-_]*"
                className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="e.g., user-videos or archive"
              />
              <p className="text-xs text-muted mt-1">
                Additional nesting level (e.g., "yoom-videos/[prefix]/video-id/")
              </p>
            </div>

            <button
              type="submit"
              disabled={testingR2}
              className="w-full py-3 px-4 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testingR2 ? "Testing Connection..." : "Test R2 Connection"}
            </button>
          </form>

          {/* Storage Usage */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="font-semibold mb-3">Local Storage Usage</h3>
            {storageStats ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Recordings:</span>
                  <span className="font-medium">{storageStats.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Total Size:</span>
                  <span className="font-medium">
                    {(storageStats.totalSize / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status:</span>
                  <span className="font-medium text-green-500">IndexedDB Ready</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Loading storage statistics...</p>
            )}
          </div>

          {/* Configuration Instructions */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="font-semibold mb-3">⚠️ Configuration Changes</h3>
            <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 px-4 py-3 rounded text-sm">
              <p className="font-semibold mb-2">Manual Update Required</p>
              <p className="mb-2">
                To change folder configuration, update these environment variables in Vercel:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li><code className="bg-black/20 px-1 rounded">R2_FOLDER_PATH</code> - Base folder name</li>
                <li><code className="bg-black/20 px-1 rounded">R2_FOLDER_PREFIX</code> - Optional prefix</li>
              </ul>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to Vercel Dashboard → Project → Settings → Environment Variables</li>
                <li>Add or update the variables above</li>
                <li>Click Save</li>
                <li>Redeploy your application</li>
              </ol>
            </div>
            <div className="mt-4 text-sm">
              <a
                href={`https://dash.cloudflare.com/${process.env.R2_ACCOUNT_ID}/r2/buckets/${process.env.R2_BUCKET_NAME}/objects`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                → Open R2 Dashboard
              </a>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">My Recordings</h2>

          {recordingsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <p className="mt-2 text-sm text-muted">Loading recordings...</p>
            </div>
          ) : recordingsError ? (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
              {recordingsError}
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted">No recordings found</p>
              <p className="text-sm text-muted mt-2">Your recordings will appear here once you upload them.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Size</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recordings.map((recording) => (
                    <tr key={recording.videoId} className="border-b border-border hover:bg-surface-hover">
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground truncate max-w-[200px]">
                          {recording.title}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted">
                        {formatDate(recording.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-muted">
                        {formatSize(recording.size)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(recording.status)}`}>
                          {recording.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {recording.status === 'completed' && recording.r2Key && (
                            <button
                              onClick={() => handleDownloadRecording(recording)}
                              className="px-3 py-1 bg-accent text-white rounded hover:bg-accent-hover transition-colors text-xs"
                              title="Download"
                            >
                              Download
                            </button>
                          )}
                          {recording.status === 'failed' && (
                            <button
                              onClick={() => handleRetryRecording(recording.videoId)}
                              disabled={retryingVideoId === recording.videoId}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                              title="Retry upload"
                            >
                              Retry
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRecording(recording.videoId)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                            title="Delete"
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
          )}
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Signed in as</h3>
              <p className="text-sm text-muted">{session.user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="text-center">
          <a href="/" className="text-accent hover:underline text-sm">
            ← Back to Home
          </a>
        </div>
      </div>
      </main>
    </>
  );
}
