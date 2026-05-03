/**
 * app/not-found.tsx
 * Custom 404 page shown when a route doesn't exist or notFound() is called.
 */
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-8">
      <MapPin className="h-12 w-12 text-[#00c2cc] mb-4" />
      <h1 className="text-6xl font-bold text-white mb-2">404</h1>
      <p className="text-xl text-muted-foreground mb-2">Page not found</p>
      <p className="text-sm text-muted-foreground mb-8 text-center max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or you don&apos;t
        have access to it.
      </p>
      <div className="flex gap-3">
        <Button render={<Link href="/dashboard" />}>Go to Dashboard</Button>
        <Button variant="outline" render={<Link href="/" />}>Home</Button>
      </div>
    </div>
  );
}
