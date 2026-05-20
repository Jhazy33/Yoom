import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Yoom - Personal Screen Recording",
  description: "Your personal screen recording tool with AI transcription",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${jakarta.className} bg-background text-foreground min-h-screen antialiased selection:bg-accent/20 selection:text-foreground`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
