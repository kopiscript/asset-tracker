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
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {isSignedIn ? (
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-semibold gap-2"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/sign-up">
            <Button
              size="lg"
              className="bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-semibold gap-2"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <Button size="lg" variant="outline" render={<a href="#features" />}>
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
          className="bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-semibold"
        >
          Go to Dashboard
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/sign-in">
        <Button variant="ghost" size={size}>
          Sign In
        </Button>
      </Link>
      <Link href="/sign-up">
        <Button
          size={size}
          className="bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-semibold"
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
      <Link href="/dashboard">
        <Button
          size="lg"
          className="bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-bold gap-2 px-8"
        >
          Go to Dashboard <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    );
  }

  return (
    <Link href="/sign-up">
      <Button
        size="lg"
        className="bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-bold gap-2 px-8"
      >
        Get Started Free <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}
