"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Props {
  orgId: string;
  fleetId: string;
  action: "add-vehicle" | "remove-vehicle" | "add-member" | "remove-member";
  targetId?: string;
  options?: { id: string; label: string }[];
}

export function FleetPageClient({ orgId, fleetId, action, targetId, options }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!selected) return;
    setLoading(true);
    const isVehicle = action === "add-vehicle";
    const url = isVehicle
      ? `/api/orgs/${orgId}/fleets/${fleetId}/vehicles/${selected}`
      : `/api/orgs/${orgId}/fleets/${fleetId}/members/${selected}`;
    await fetch(url, { method: "POST" });
    setLoading(false);
    setOpen(false);
    setSelected("");
    router.refresh();
  }

  async function handleRemove() {
    setLoading(true);
    const isVehicle = action === "remove-vehicle";
    const url = isVehicle
      ? `/api/orgs/${orgId}/fleets/${fleetId}/vehicles/${targetId}`
      : `/api/orgs/${orgId}/fleets/${fleetId}/members/${targetId}`;
    await fetch(url, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  if (action === "remove-vehicle" || action === "remove-member") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-red-400"
        onClick={handleRemove}
        disabled={loading}
        aria-label="Remove"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    );
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setOpen(true)}>
        {action === "add-vehicle" ? (
          <><Plus className="h-3.5 w-3.5" /> Add Vehicle</>
        ) : (
          <><UserPlus className="h-3.5 w-3.5" /> Add Member</>
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selected} onValueChange={(v) => v && setSelected(v)}>
        <SelectTrigger className="h-8 text-xs w-52">
          <SelectValue placeholder={action === "add-vehicle" ? "Select vehicle…" : "Select user…"} />
        </SelectTrigger>
        <SelectContent>
          {(options ?? []).map((o) => (
            <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={handleAdd} disabled={loading || !selected} className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
        {loading ? "…" : "Add"}
      </Button>
      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setOpen(false); setSelected(""); }}>
        Cancel
      </Button>
    </div>
  );
}
