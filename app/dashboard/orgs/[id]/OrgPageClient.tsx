"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLang } from "@/components/LanguageProvider";

interface Props {
  orgId: string;
}

export function OrgPageClient({ orgId }: Props) {
  const router = useRouter();
  const { tr } = useLang();
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
      setError(json?.error ?? tr("noData"));
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
        <UserPlus className="h-3.5 w-3.5" /> {tr("invite")}
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2">
      <Input
        autoFocus
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={`${tr("emailAddress")}…`}
        className="h-10 text-sm w-full sm:w-48"
        required
      />
      <Select value={role} onValueChange={(v) => v && setRole(v)}>
        <SelectTrigger className="h-10 text-sm w-full sm:w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="owner">{tr("owner")}</SelectItem>
          <SelectItem value="admin">{tr("admin")}</SelectItem>
          <SelectItem value="viewer">{tr("viewer")}</SelectItem>
        </SelectContent>
      </Select>
      {error && <span className="text-sm text-red-500 w-full sm:w-auto">{error}</span>}
      <div className="flex gap-2 w-full sm:w-auto">
        <Button size="sm" type="submit" disabled={loading} className="h-10 text-sm flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? "…" : tr("add")}
        </Button>
        <Button size="sm" type="button" variant="ghost" className="h-10 text-sm flex-1 sm:flex-none" onClick={() => { setOpen(false); setError(""); }}>
          {tr("cancel")}
        </Button>
      </div>
    </form>
  );
}
