"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Org = { id: string; name: string };

interface Props {
  vehicleId: string;
  orgId:     string | null;
  orgName:   string | null;
  orgs:      Org[];
}

export function AdminAssignOrgCell({ vehicleId, orgId, orgName, orgs }: Props) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function assign(newOrgId: string | null) {
    setLoading(true);
    await fetch(`/api/vehicles/${vehicleId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ orgId: newOrgId }),
    });
    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return orgId ? (
      <button
        onClick={() => setEditing(true)}
        className="text-left text-muted-foreground hover:text-foreground transition-colors text-sm min-h-[44px] flex items-center"
        title="Click to reassign"
      >
        {orgName}
      </button>
    ) : (
      <button
        onClick={() => setEditing(true)}
        className="text-sm text-primary hover:underline font-medium min-h-[44px] flex items-center"
      >
        Assign org
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        autoFocus
        disabled={loading}
        defaultValue={orgId ?? ""}
        onChange={(e) => assign(e.target.value || null)}
        className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">— Unassigned —</option>
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <button
        onClick={() => setEditing(false)}
        className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
        aria-label="Cancel"
      >
        ✕
      </button>
    </div>
  );
}
