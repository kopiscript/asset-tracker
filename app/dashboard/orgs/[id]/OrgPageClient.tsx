"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Props {
  orgId: string;
  action: "invite-member" | "create-fleet";
}

export function OrgPageClient({ orgId, action }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [role, setRole] = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setError("");

    let res: Response;
    if (action === "invite-member") {
      res = await fetch(`/api/orgs/${orgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value.trim(), role }),
      });
    } else {
      res = await fetch(`/api/orgs/${orgId}/fleets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value.trim() }),
      });
    }

    const json = await res.json().catch(() => null) as { error?: string } | null;
    setLoading(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed.");
      return;
    }

    setValue("");
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
        {action === "invite-member" ? (
          <><UserPlus className="h-3.5 w-3.5" /> Invite</>
        ) : (
          <><Plus className="h-3.5 w-3.5" /> New Fleet</>
        )}
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={action === "invite-member" ? "Email address…" : "Fleet name…"}
        className="h-8 text-xs w-48"
        required
      />
      {action === "invite-member" && (
        <Select value={role} onValueChange={(v) => v && setRole(v)}>
          <SelectTrigger className="h-8 text-xs w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
          </SelectContent>
        </Select>
      )}
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
