"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  // @ts-ignore - NextAuth v5 SessionProvider has type incompatibility with React 19
  // This is a known issue and does not affect runtime functionality
  return <SessionProvider>{children}</SessionProvider>;
}
