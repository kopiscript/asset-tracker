import crypto from "crypto";
import Link from "next/link";
import { MapPin, Clock, CheckCircle } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InvitePageClient } from "./InvitePageClient";

export const metadata = { title: "Join a fleet — Mirae Fleet" };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="shrink-0 h-14 px-6 flex items-center border-b border-border/40">
        <div className="max-w-7xl w-full mx-auto flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <MapPin className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">Mirae</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        {children}
      </main>
    </div>
  );
}

export default async function InvitePage(props: PageProps<"/invite/[token]">) {
  const { token } = await props.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const invite = await prisma.orgInvite.findUnique({
    where: { token: hashedToken },
    include: {
      org: { select: { name: true } },
      inviter: { select: { name: true } },
    },
  });

  // ── Invalid / not found ─────────────────────────────────────────────────
  if (!invite) {
    return (
      <Shell>
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <h1 className="font-display text-2xl text-foreground mb-2">Invite not found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This invite link is invalid. Ask your fleet owner to send you a new one.
          </p>
          <Link href="/sign-in" className="text-sm text-primary hover:text-primary/80 font-medium">
            Go to sign in
          </Link>
        </div>
      </Shell>
    );
  }

  // ── Already accepted ────────────────────────────────────────────────────
  if (invite.acceptedAt) {
    return (
      <Shell>
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <h1 className="font-display text-2xl text-foreground mb-2">
            You&apos;ve already joined this fleet.
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {invite.org.name} is ready for you.
          </p>
          <Link href="/dashboard" className="text-sm text-primary hover:text-primary/80 font-medium">
            Go to dashboard
          </Link>
        </div>
      </Shell>
    );
  }

  // ── Expired ─────────────────────────────────────────────────────────────
  if (invite.expiresAt < new Date()) {
    return (
      <Shell>
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <h1 className="font-display text-2xl text-foreground mb-2">This invite link has expired.</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Ask {invite.inviter.name} to send you a new one.
          </p>
          <Link href="/sign-in" className="text-sm text-primary hover:text-primary/80 font-medium">
            Go to sign in
          </Link>
        </div>
      </Shell>
    );
  }

  // ── Valid ───────────────────────────────────────────────────────────────
  const session = await auth();
  const sessionEmail = session?.user?.email ?? null;

  return (
    <Shell>
      <InvitePageClient
        token={token}
        orgName={invite.org.name}
        inviterName={invite.inviter.name}
        role={invite.role}
        email={invite.email}
        sessionEmail={sessionEmail}
      />
    </Shell>
  );
}
