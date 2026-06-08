"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";

interface Props {
  orgId: string;
  inviteId: string;
  email: string;
}

export function RevokeInviteButton({ orgId, inviteId, email }: Props) {
  const router = useRouter();
  const { tr } = useLang();
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    if (!confirm(tr("revokeConfirm").replace("{email}", email))) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orgs/${orgId}/invites/${inviteId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json().catch(() => null) as { error?: string } | null;
        alert(json?.error ?? tr("failedRevoke"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={loading}
      title={tr("revokeInvite")}
      className="p-2.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <X className="h-3.5 w-3.5" />
      }
    </button>
  );
}
