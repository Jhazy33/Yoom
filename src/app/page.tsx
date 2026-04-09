"use client";

import { useState } from "react";
import { PasswordGate } from "@/components/password-gate";

export default function Home() {
  const [password, setPassword] = useState<string | null>(null);

  if (!password) {
    return <PasswordGate onAuthenticated={setPassword} />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-neutral-400">Recorder goes here</p>
    </main>
  );
}
