"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  // @ts-expect-error - NextAuth v5 beta has incomplete types for React 19. This is a known issue with SessionProvider types.
  return <SessionProvider>{children}</SessionProvider>;
}
