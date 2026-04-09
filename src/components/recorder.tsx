"use client";

import { useState, useRef, useCallback } from "react";
import { DeviceSelector } from "./device-selector";
import { RecordingPreview } from "./recording-preview";

type RecordingMode = "screen" | "camera" | "screen+camera";
type RecorderState = "idle" | "recording" | "uploading" | "done";

interface RecorderProps {
  password: string;
}

export function Recorder({ password }: RecorderProps) {
  const [mode, setMode] = useState<RecordingMode>("screen");
  const [micId, setMicId] = useState("");
  const [cameraId, setCameraId] = useState("");
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [shareUrl, setShareUrl] = useState("");
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const stopAllStreams = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    cameraStreamRef.current = null;
    setScreenStream(null);
    setCameraStream(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  async function startRecording() {
    setError("");
    chunksRef.current = [];

    try {
      let recordStream: MediaStream;

      if (mode === "screen" || mode === "screen+camera") {
        const screen = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStreamRef.current = screen;
        setScreenStream(screen);

        // Stop recording if user ends screen share via browser UI
        screen.getVideoTracks()[0].addEventListener("ended", () => {
          stopRecording();
        });
      }

      if (mode === "camera" || mode === "screen+camera") {
        const camera = await navigator.mediaDevices.getUserMedia({
          video: cameraId ? { deviceId: { exact: cameraId } } : true,
          audio: mode === "camera" ? (micId ? { deviceId: { exact: micId } } : true) : false,
        });
        cameraStreamRef.current = camera;
        setCameraStream(camera);
      }

      if (mode === "screen") {
        // Use screen stream, add mic audio if selected
        recordStream = screenStreamRef.current!;
        if (micId) {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: micId } },
          });
          micStream.getAudioTracks().forEach((t) => recordStream.addTrack(t));
        }
      } else if (mode === "camera") {
        recordStream = cameraStreamRef.current!;
        if (micId) {
          // Replace audio track with selected mic
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: micId } },
          });
          cameraStreamRef.current!.getAudioTracks().forEach((t) => t.stop());
          recordStream = new MediaStream([
            ...cameraStreamRef.current!.getVideoTracks(),
            ...micStream.getAudioTracks(),
          ]);
        }
      } else {
        // screen+camera — composite via canvas
        const canvas = canvasRef.current!;
        // Wait a tick for canvas to start drawing
        await new Promise((r) => setTimeout(r, 200));
        const canvasStream = canvas.captureStream(30);

        // Add mic audio
        if (micId) {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: micId } },
          });
          micStream.getAudioTracks().forEach((t) => canvasStream.addTrack(t));
        } else if (screenStreamRef.current!.getAudioTracks().length > 0) {
          screenStreamRef.current!.getAudioTracks().forEach((t) => canvasStream.addTrack(t));
        }

        recordStream = canvasStream;
      }

      const mediaRecorder = new MediaRecorder(recordStream, {
        mimeType: "video/webm;codecs=vp9",
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => handleRecordingComplete();

      mediaRecorder.start(1000); // collect chunks every second
      mediaRecorderRef.current = mediaRecorder;
      setState("recording");

      // Start timer
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      stopAllStreams();
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Permission denied. Please allow screen/camera access.");
      } else {
        setError("Failed to start recording. Check your device permissions.");
      }
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function handleRecordingComplete() {
    setState("uploading");
    stopAllStreams();

    const blob = new Blob(chunksRef.current, { type: "video/webm" });

    try {
      // Get presigned URL
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-upload-password": password },
      });

      if (!res.ok) throw new Error("Failed to get upload URL");

      const { presignedUrl, key } = await res.json();

      // Upload to R2
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", "video/webm");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(blob);
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      setShareUrl(`${appUrl}/watch/${key}`);
      setState("done");
    } catch {
      setError("Upload failed. Please try again.");
      setState("idle");
    }
  }

  function reset() {
    setState("idle");
    setShareUrl("");
    setElapsed(0);
    setUploadProgress(0);
    setError("");
    chunksRef.current = [];
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(shareUrl);
  }

  // ----- RENDER -----

  if (state === "done") {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="rounded-full w-12 h-12 bg-green-500/10 text-green-400 flex items-center justify-center mx-auto text-xl">
            ✓
          </div>
          <h2 className="text-xl font-semibold">Recording uploaded</h2>
          <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent text-sm text-neutral-300 outline-none truncate"
            />
            <button
              onClick={copyToClipboard}
              className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-neutral-950 hover:bg-neutral-200 transition-colors"
            >
              Copy
            </button>
          </div>
          <button
            onClick={reset}
            className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Record another
          </button>
        </div>
      </main>
    );
  }

  if (state === "uploading") {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4 text-center">
          <h2 className="text-xl font-semibold">Uploading...</h2>
          <div className="w-full rounded-full bg-neutral-800 h-2">
            <div
              className="h-2 rounded-full bg-white transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-neutral-400">{uploadProgress}%</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      {/* Preview */}
      {state === "recording" && (
        <RecordingPreview
          mode={mode}
          screenStream={screenStream}
          cameraStream={cameraStream}
          canvasRef={canvasRef}
        />
      )}

      {/* Hidden canvas for compositing (needed before recording starts too) */}
      {mode === "screen+camera" && state !== "recording" && (
        <canvas ref={canvasRef} className="hidden" />
      )}

      <div className="w-full max-w-md space-y-6">
        {state === "idle" && (
          <>
            {/* Mode selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "screen", label: "Screen" },
                  { value: "camera", label: "Camera" },
                  { value: "screen+camera", label: "Screen + Cam" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      mode === opt.value
                        ? "border-white bg-white text-neutral-950"
                        : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Device selectors */}
            <DeviceSelector
              kind="audioinput"
              label="Microphone"
              value={micId}
              onChange={setMicId}
            />
            {(mode === "camera" || mode === "screen+camera") && (
              <DeviceSelector
                kind="videoinput"
                label="Camera"
                value={cameraId}
                onChange={setCameraId}
              />
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {state === "idle" && (
            <button
              onClick={startRecording}
              className="rounded-lg bg-red-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
            >
              Start Recording
            </button>
          )}

          {state === "recording" && (
            <>
              <span className="flex items-center gap-2 text-sm text-neutral-300">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                {formatTime(elapsed)}
              </span>
              <button
                onClick={stopRecording}
                className="rounded-lg border border-neutral-600 px-6 py-2.5 text-sm font-medium text-neutral-100 hover:bg-neutral-800 transition-colors"
              >
                Stop
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
