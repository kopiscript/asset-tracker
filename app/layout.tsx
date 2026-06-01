/**
 * app/layout.tsx
 * Root layout — wraps every page in the app.
 * Sets up fonts, AuthProvider (NextAuth SessionProvider), and TooltipProvider.
 * Forces the dark theme site-wide via the "dark" class on <html>, with the
 * brand accent overridden to red by "theme-red-accent".
 */
import type { Metadata } from "next";
import { Space_Grotesk, DM_Serif_Display, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

// UI / body — geometric, excellent tabular numerals for dashboard stats
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Display — editorial serif for headlines and feature titles
const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

// Mono — plate numbers, code, API keys
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mirae — Fleet Tracking",
  description:
    "Real-time vehicle tracking for Malaysian fleets. Monitor positions, manage access, and review trip history.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark theme-red-accent ${spaceGrotesk.variable} ${dmSerifDisplay.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
