"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";

interface Props {
  orgId: string;
  userId: string;
  currentRole: string;
}

const roleColor: Record<string, string> = {
  owner: "bg-primary/10 text-primary border-primary/20",
  admin: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  viewer: "bg-muted text-muted-foreground border-border",
};

export function ChangeRoleSelect({ orgId, userId, currentRole }: Props) {
  const router = useRouter();
  const { tr } = useLang();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(currentRole);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (next === role) return;
    setLoading(true);
    const res = await fetch(`/api/orgs/${orgId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => null) as { error?: string } | null;
      alert(json?.error ?? tr("failedChangeRole"));
      return;
    }
    setRole(next);
    router.refresh();
  }

  if (loading) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${roleColor[role] ?? roleColor.viewer}`}>
        <Loader2 className="h-3 w-3 animate-spin" />
      </span>
    );
  }

  return (
    <select
      value={role}
      onChange={handleChange}
      className={`text-xs px-2 py-0.5 rounded-full border font-medium bg-transparent cursor-pointer focus:outline-none ${roleColor[role] ?? roleColor.viewer}`}
    >
      <option value="owner">{tr("owner")}</option>
      <option value="admin">{tr("admin")}</option>
      <option value="viewer">{tr("viewer")}</option>
    </select>
  );
}
