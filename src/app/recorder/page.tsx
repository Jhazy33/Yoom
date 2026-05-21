"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { Recorder } from "@/components/recorder";
import { BackButton } from "@/components/back-button";
import { HomeIconButton } from "@/components/home-icon-button";
import { useState } from "react";

export default function RecorderPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Back button - left */}
      <div className="absolute top-4 left-4 z-30">
        <BackButton />
      </div>

      {/* Home icon button - right */}
      <div className="absolute top-4 right-4 z-30">
        <HomeIconButton />
      </div>

      <Recorder />
    </div>
  );
}
