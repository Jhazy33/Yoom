"use client";

import { useRouter } from "next/navigation";
import { Home } from "lucide-react";

interface HomeIconButtonProps {
  className?: string;
}

export function HomeIconButton({ className = "" }: HomeIconButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push("/");
  };

  return (
    <button
      onClick={handleClick}
      className={`
        p-2 rounded-lg hover:bg-surface-raised transition-colors
        text-muted hover:text-foreground
        ${className}
      `}
      aria-label="Go to home"
    >
      <Home size={24} />
    </button>
  );
}
