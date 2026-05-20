"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { YoomLogo } from "./logo";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Close sidebar when route changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const navItems = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/recorder", label: "Start Recording", icon: "⏺️" },
    { href: "/recordings", label: "Manage Recordings", icon: "📁" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full w-72 bg-surface border-r border-border z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Navigation sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <YoomLogo size="md" />
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-raised transition-colors text-muted hover:text-foreground"
              aria-label="Close sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  text-foreground font-medium transition-all
                  hover:bg-surface-raised hover:text-accent
                  active:scale-[0.98]
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                text-foreground font-medium transition-all
                hover:bg-surface-raised hover:text-red-500
                active:scale-[0.98]"
            >
              <span className="text-xl">🚪</span>
              <span>Sign Out</span>
            </button>
            <div className="px-4 py-2 text-xs text-muted-dim text-center">
              Yoom v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface HamburgerButtonProps {
  onClick: () => void;
  className?: string;
}

export function HamburgerButton({ onClick, className = "" }: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        p-2 rounded-lg hover:bg-surface-raised transition-colors
        text-muted hover:text-foreground
        ${className}
      `}
      aria-label="Open navigation menu"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
