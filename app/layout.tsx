/**
 * app/layout.tsx
 * Root layout — wraps every page in the app.
 * Sets up fonts, ClerkProvider (auth), and TooltipProvider (shadcn/ui).
 * Forces the dark theme by adding the "dark" class to <html>.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✏️ EDIT: Change the app title and description
export const metadata: Metadata = {
  title: "FleetTrack — Vehicle Asset Tracker",
  description:
    "Real-time vehicle tracking dashboard for Malaysian fleets. Monitor your vehicles, manage access, and stay in control.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // ClerkProvider must wrap the whole app so auth works everywhere
    <ClerkProvider>
      {/* "dark" class enables the dark colour scheme from globals.css */}
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          {/* TooltipProvider is required by shadcn/ui tooltip components */}
          <TooltipProvider>{children}</TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
