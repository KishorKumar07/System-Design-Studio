import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Architect — System Design Studio",
  description: "Design systems on a real canvas, get AI-graded feedback, build a portfolio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // next-themes sets this before hydration, and some browser extensions
      // (e.g. automation tools) inject their own attributes here too —
      // neither is something React's tree can predict server-side.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
