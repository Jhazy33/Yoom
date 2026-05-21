"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  href?: string;
  className?: string;
}

export function BackButton({ href, className = "" }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href !== undefined) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        p-2 rounded-lg hover:bg-surface-raised transition-colors
        text-muted hover:text-foreground
        ${className}
      `}
      aria-label="Go back"
    >
      <ArrowLeft size={24} />
    </button>
  );
}
