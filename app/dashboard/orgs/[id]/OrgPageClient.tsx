"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Props {
  orgId: string;
}

export function OrgPageClient({ orgId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/orgs/${orgId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role }),
    });

    const json = await res.json().catch(() => null) as { error?: string } | null;
    setLoading(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed.");
      return;
    }

    setEmail("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-xs"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="h-3.5 w-3.5" /> Invite
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        autoFocus
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address…"
        className="h-8 text-xs w-48"
        required
      />
      <Select value={role} onValueChange={(v) => v && setRole(v)}>
        <SelectTrigger className="h-8 text-xs w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="owner">Owner</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="viewer">Viewer</SelectItem>
        </SelectContent>
      </Select>
      {error && <span className="text-xs text-red-500">{error}</span>}
      <Button size="sm" type="submit" disabled={loading} className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
        {loading ? "…" : "Add"}
      </Button>
      <Button size="sm" type="button" variant="ghost" className="h-8 text-xs" onClick={() => { setOpen(false); setError(""); }}>
        Cancel
      </Button>
    </form>
  );
}
