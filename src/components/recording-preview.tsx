"use client";

import { useEffect, useRef } from "react";

interface RecordingPreviewProps {
  mode: "screen" | "camera" | "screen+camera";
  screenStream: MediaStream | null;
  cameraStream: MediaStream | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function RecordingPreview({
  mode,
  screenStream,
  cameraStream,
  canvasRef,
}: RecordingPreviewProps) {
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Canvas compositing for screen+camera mode
  useEffect(() => {
    if (mode !== "screen+camera" || !canvasRef.current || !screenStream || !cameraStream) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const screenVideo = screenVideoRef.current!;
    const cameraVideo = cameraVideoRef.current!;

    function draw() {
      if (!screenVideo.videoWidth) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      canvas.width = screenVideo.videoWidth;
      canvas.height = screenVideo.videoHeight;

      // Draw screen
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

      // Draw camera overlay (bottom-right, 20% of screen width)
      const camWidth = Math.round(canvas.width * 0.2);
      const camHeight = Math.round(
        camWidth * (cameraVideo.videoHeight / (cameraVideo.videoWidth || 1))
      );
      const padding = 20;
      const camX = canvas.width - camWidth - padding;
      const camY = canvas.height - camHeight - padding;

      // Rounded rectangle clip for camera
      const radius = 12;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(camX + radius, camY);
      ctx.lineTo(camX + camWidth - radius, camY);
      ctx.quadraticCurveTo(camX + camWidth, camY, camX + camWidth, camY + radius);
      ctx.lineTo(camX + camWidth, camY + camHeight - radius);
      ctx.quadraticCurveTo(camX + camWidth, camY + camHeight, camX + camWidth - radius, camY + camHeight);
      ctx.lineTo(camX + radius, camY + camHeight);
      ctx.quadraticCurveTo(camX, camY + camHeight, camX, camY + camHeight - radius);
      ctx.lineTo(camX, camY + radius);
      ctx.quadraticCurveTo(camX, camY, camX + radius, camY);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(cameraVideo, camX, camY, camWidth, camHeight);
      ctx.restore();

      // Border around camera
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(camX + radius, camY);
      ctx.lineTo(camX + camWidth - radius, camY);
      ctx.quadraticCurveTo(camX + camWidth, camY, camX + camWidth, camY + radius);
      ctx.lineTo(camX + camWidth, camY + camHeight - radius);
      ctx.quadraticCurveTo(camX + camWidth, camY + camHeight, camX + camWidth - radius, camY + camHeight);
      ctx.lineTo(camX + radius, camY + camHeight);
      ctx.quadraticCurveTo(camX, camY + camHeight, camX, camY + camHeight - radius);
      ctx.lineTo(camX, camY + radius);
      ctx.quadraticCurveTo(camX, camY, camX + radius, camY);
      ctx.closePath();
      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [mode, screenStream, cameraStream, canvasRef]);

  return (
    <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800">
      {/* Screen-only preview */}
      {mode === "screen" && (
        <video
          ref={screenVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain"
        />
      )}

      {/* Camera-only preview */}
      {mode === "camera" && (
        <video
          ref={cameraVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain mirror"
          style={{ transform: "scaleX(-1)" }}
        />
      )}

      {/* Screen + Camera: show canvas, hide source videos */}
      {mode === "screen+camera" && (
        <>
          <video ref={screenVideoRef} autoPlay muted playsInline className="hidden" />
          <video ref={cameraVideoRef} autoPlay muted playsInline className="hidden" />
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
        </>
      )}
    </div>
  );
}
