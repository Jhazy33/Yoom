"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Recorder } from "@/components/recorder";
import { Sidebar, HamburgerButton } from "@/components/sidebar";
import { useState } from "react";

export default function RecorderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

      <div className="min-h-screen">
        {/* Header with hamburger menu */}
        <div className="absolute top-4 left-4 z-30">
          <HamburgerButton onClick={() => setSidebarOpen(true)} />
        </div>

        <Recorder />
      </div>
    </>
  );
}
