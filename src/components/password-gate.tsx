"use client";

import { useState } from "react";

interface PasswordGateProps {
  onAuthenticated: (password: string) => void;
}

export function PasswordGate({ onAuthenticated }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      onAuthenticated(password);
    } else {
      setError("Invalid password");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div className="space-y-1.5 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Yoom</h1>
          <p className="text-sm text-neutral-500">
            Enter password to start recording
          </p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900/80 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700 transition-all"
          autoFocus
        />
        {error && (
          <p className="text-sm text-red-400/90 text-center">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-950 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Checking..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
