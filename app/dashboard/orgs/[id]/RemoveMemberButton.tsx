"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";

interface Props {
  orgId: string;
  userId: string;
  userName: string;
}

export function RemoveMemberButton({ orgId, userId, userName }: Props) {
  const router = useRouter();
  const { tr } = useLang();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm(tr("removeConfirm").replace("{name}", userName))) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orgs/${orgId}/members/${userId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json().catch(() => null) as { error?: string } | null;
        alert(json?.error ?? tr("failedRemove"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      title={`${tr("remove")} ${userName}`}
      className="p-2.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <Trash2 className="h-3.5 w-3.5" />
      }
    </button>
  );
}
