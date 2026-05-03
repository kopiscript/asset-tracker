/**
 * app/dashboard/vehicles/[id]/share/SharePageClient.tsx
 * Client component for the share/permissions page.
 * Handles:
 *  - Invite by email + role
 *  - Remove user access
 *  - Change a user's role
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type AccessEntry = {
  id: string;
  userId: string;
  role: string;
  userName: string | null;
  userEmail: string;
  isCurrentUser: boolean;
};

interface SharePageClientProps {
  vehicleId: string;
  initialAccesses: AccessEntry[];
}

export function SharePageClient({
  vehicleId,
  initialAccesses,
}: SharePageClientProps) {
  const router = useRouter();
  const [accesses, setAccesses] = useState(initialAccesses);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError("");
    setInviteSuccess("");

    const res = await fetch(`/api/vehicles/${vehicleId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    const json = await res.json();
    setInviteLoading(false);

    if (!res.ok) {
      setInviteError(json.error ?? "Failed to invite user.");
      return;
    }

    setInviteSuccess(`${inviteEmail} has been granted ${inviteRole} access.`);
    setInviteEmail("");
    router.refresh();
    // Re-fetch access list
    const listRes = await fetch(`/api/vehicles/${vehicleId}/share`);
    const listJson = await listRes.json();
    if (listJson.data) setAccesses(listJson.data);
  }

  async function handleRemove(userId: string) {
    const res = await fetch(`/api/vehicles/${vehicleId}/share/${userId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setAccesses((prev) => prev.filter((a) => a.userId !== userId));
      router.refresh();
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    const res = await fetch(`/api/vehicles/${vehicleId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    if (res.ok) {
      setAccesses((prev) =>
        prev.map((a) => (a.userId === userId ? { ...a, role: newRole } : a))
      );
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* ── Invite form ────────────────────────────────────────────── */}
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-[#00c2cc]" />
          Invite Someone
        </h2>

        <form onSubmit={handleInvite} className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email address…"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 bg-background border-border/50"
              required
            />
            <Select value={inviteRole} onValueChange={(v) => v && setInviteRole(v)}>
              <SelectTrigger className="w-28 bg-background border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {inviteError && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded px-3 py-2">
              {inviteError}
            </p>
          )}
          {inviteSuccess && (
            <p className="text-xs text-green-400 bg-green-500/10 rounded px-3 py-2">
              {inviteSuccess}
            </p>
          )}

          <Button
            type="submit"
            disabled={inviteLoading}
            className="w-full bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-semibold"
          >
            {inviteLoading ? "Inviting…" : "Invite"}
          </Button>
        </form>

        {/* Role legend */}
        <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <div>
            <p className="font-semibold text-white">Viewer</p>
            <p>Can view only</p>
          </div>
          <div>
            <p className="font-semibold text-white">Editor</p>
            <p>Can view + edit details</p>
          </div>
          <div>
            <p className="font-semibold text-white">Owner</p>
            <p>Full control</p>
          </div>
        </div>
      </div>

      {/* ── Current access list ─────────────────────────────────────── */}
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">
          Current Access ({accesses.length})
        </h2>

        <div className="space-y-2">
          {accesses.map((entry, i) => (
            <div key={entry.userId}>
              {i > 0 && <Separator className="bg-border/50 my-2" />}
              <div className="flex items-center gap-3">
                {/* Avatar placeholder */}
                <div className="h-8 w-8 rounded-full bg-[#00c2cc]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-[#00c2cc]">
                    {(entry.userName ?? entry.userEmail)[0].toUpperCase()}
                  </span>
                </div>

                {/* Name + email */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {entry.userName ?? entry.userEmail}
                    {entry.isCurrentUser && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {entry.userEmail}
                  </p>
                </div>

                {/* Role selector / badge */}
                {entry.role === "owner" || entry.isCurrentUser ? (
                  <Badge variant="secondary" className="capitalize">
                    {entry.role}
                  </Badge>
                ) : (
                  <Select
                    value={entry.role}
                    onValueChange={(v) => v && handleRoleChange(entry.userId, v)}
                  >
                    <SelectTrigger className="w-24 h-7 text-xs bg-background border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* Remove button (can't remove yourself or owner) */}
                {!entry.isCurrentUser && entry.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-400"
                    onClick={() => handleRemove(entry.userId)}
                    aria-label={`Remove ${entry.userEmail}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
