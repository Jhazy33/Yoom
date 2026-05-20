"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  // @ts-ignore - NextAuth v5 beta type issue with React 19
  return <SessionProvider>{children}</SessionProvider>;
}
