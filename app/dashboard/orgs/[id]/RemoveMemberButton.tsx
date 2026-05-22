"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface Props {
  orgId: string;
  userId: string;
  userName: string;
}

export function RemoveMemberButton({ orgId, userId, userName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm(`Remove ${userName} from this organisation?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orgs/${orgId}/members/${userId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json().catch(() => null) as { error?: string } | null;
        alert(json?.error ?? "Failed to remove member.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      title={`Remove ${userName}`}
      className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <Trash2 className="h-3.5 w-3.5" />
      }
    </button>
  );
}
