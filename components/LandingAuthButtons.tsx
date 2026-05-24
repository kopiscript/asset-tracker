/**
 * components/LandingAuthButtons.tsx
 * Shows sign-in/sign-up links when signed out, or a "Go to Dashboard" link
 * when signed in. Uses NextAuth's useSession() for auth state.
 */
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface LandingAuthButtonsProps {
  size?: "sm" | "lg" | "default";
  variant?: "hero" | "nav";
}

export function LandingAuthButtons({
  size = "default",
  variant = "hero",
}: LandingAuthButtonsProps) {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";
  const isHero = variant === "hero";

  if (isHero) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        {isSignedIn ? (
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <Button size="lg" variant="outline" className="w-full sm:w-auto" nativeButton={false} render={<a href="#features" />}>
          Learn More
        </Button>
      </div>
    );
  }

  // nav variant
  if (isSignedIn) {
    return (
      <Link href="/dashboard">
        <Button
          size={size}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          Go to Dashboard
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-3">
      <Link href="/sign-in">
        <Button variant="ghost" size={size} className="min-h-[44px] min-w-[44px]">
          Sign In
        </Button>
      </Link>
      <Link href="/sign-up">
        <Button
          size={size}
          className="min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          Get Started Free
        </Button>
      </Link>
    </div>
  );
}

/** CTA button variant — single action button */
export function LandingCtaButton() {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";

  if (isSignedIn) {
    return (
      <Link href="/dashboard" className="w-full sm:w-auto">
        <Button
          size="lg"
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 px-8"
        >
          Go to Dashboard <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    );
  }

  return (
    <Link href="/sign-up" className="w-full sm:w-auto">
      <Button
        size="lg"
        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 px-8"
      >
        Get Started Free <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}
