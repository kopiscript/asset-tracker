/**
 * components/LandingAuthButtons.tsx
 * Client component that shows sign-in/sign-up buttons when the user is
 * signed out, or a "Go to Dashboard" button when signed in.
 * Uses Clerk v7's Show component for conditional auth rendering.
 */
"use client";

import Link from "next/link";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
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
  const isHero = variant === "hero";

  return (
    <>
      {/* Shown when signed OUT */}
      <Show when="signed-out">
        {isHero ? (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <SignUpButton mode="modal">
              <Button
                size="lg"
                className="bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-semibold gap-2"
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </SignUpButton>
            <Button size="lg" variant="outline" render={<a href="#features" />}>Learn More</Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <SignInButton mode="modal">
              <Button variant="ghost" size={size}>
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button
                size={size}
                className="bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-semibold"
              >
                Get Started Free
              </Button>
            </SignUpButton>
          </div>
        )}
      </Show>

      {/* Shown when signed IN */}
      <Show when="signed-in">
        {isHero ? (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-semibold gap-2"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" render={<a href="#features" />}>Learn More</Button>
          </div>
        ) : (
          <Link href="/dashboard">
            <Button
              size={size}
              className="bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-semibold"
            >
              Go to Dashboard
            </Button>
          </Link>
        )}
      </Show>
    </>
  );
}

/** CTA button variant — just a single action button */
export function LandingCtaButton() {
  return (
    <>
      <Show when="signed-out">
        <SignUpButton mode="modal">
          <Button
            size="lg"
            className="bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-bold gap-2 px-8"
          >
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link href="/dashboard">
          <Button
            size="lg"
            className="bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-bold gap-2 px-8"
          >
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </Show>
    </>
  );
}
