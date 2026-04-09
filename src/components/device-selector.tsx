"use client";

import { useEffect, useState } from "react";

interface DeviceSelectorProps {
  kind: "audioinput" | "videoinput";
  label: string;
  value: string;
  onChange: (deviceId: string) => void;
}

export function DeviceSelector({ kind, label, value, onChange }: DeviceSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    async function loadDevices() {
      // Request permission first so device labels are available
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          kind === "audioinput" ? { audio: true } : { video: true }
        );
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        // Permission denied — devices will show without labels
      }

      const all = await navigator.mediaDevices.enumerateDevices();
      const filtered = all.filter((d) => d.kind === kind);
      setDevices(filtered);

      if (filtered.length > 0 && !value) {
        onChange(filtered[0].deviceId);
      }
    }

    loadDevices();
  }, [kind]);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-600 transition-colors appearance-none cursor-pointer"
      >
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `${kind === "audioinput" ? "Microphone" : "Camera"} ${device.deviceId.slice(0, 8)}`}
          </option>
        ))}
      </select>
    </div>
  );
}
