"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLang } from "@/components/LanguageProvider";

interface OrgVehicle {
  id: string;
  name: string | null;
  plateNumber: string | null;
}

interface Props {
  orgId: string;
  userId: string;
  memberName: string;
  vehicles: OrgVehicle[];
  /** IDs of vehicles this viewer is currently restricted to. Empty = unrestricted. */
  currentVehicleIds: string[];
}

export function ViewerAccessButton({
  orgId,
  userId,
  memberName,
  vehicles,
  currentVehicleIds,
}: Props) {
  const router = useRouter();
  const { tr } = useLang();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(currentVehicleIds));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleOpenChange(next: boolean) {
    if (next) {
      // Unrestricted (empty allowlist) → all checked; restricted → only granted ones checked
      setSelected(
        currentVehicleIds.length === 0
          ? new Set(vehicles.map((v) => v.id))
          : new Set(currentVehicleIds)
      );
      setError("");
    }
    setOpen(next);
  }

  function toggle(vehicleId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(vehicleId)) next.delete(vehicleId);
      else next.add(vehicleId);
      return next;
    });
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    // All checked = full access (send empty array); partial = send only checked IDs
    const allSelected = selected.size === vehicles.length;
    const vehicleIds = allSelected ? [] : [...selected];
    const res = await fetch(`/api/orgs/${orgId}/members/${userId}/vehicle-access`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleIds }),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => null) as { error?: string } | null;
      setError(json?.error ?? tr("failedSaveAccess"));
      return;
    }
    setOpen(false);
    router.refresh();
  }

  const isRestricted = currentVehicleIds.length > 0;
  const label = isRestricted
    ? `${currentVehicleIds.length}/${vehicles.length}`
    : tr("accessAll");

  const noneSelected = selected.size === 0;
  const allSelected = selected.size === vehicles.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button
            title={tr("vehicleAccess")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
          />
        }
      >
        <Settings2 className="h-3 w-3 flex-shrink-0" />
        <span className="font-mono">{label}</span>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{tr("vehicleAccess")}: {memberName}</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">{tr("viewerAccessHint")}</p>

        <div className="space-y-0.5 max-h-60 overflow-y-auto -mx-1">
          {vehicles.map((v) => (
            <label
              key={v.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted/50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(v.id)}
                onChange={() => toggle(v.id)}
                className="h-3.5 w-3.5 accent-primary flex-shrink-0"
              />
              <span className="text-sm text-foreground">{v.name ?? v.id}</span>
              {v.plateNumber && (
                <span className="text-xs text-muted-foreground font-mono ml-auto">
                  {v.plateNumber}
                </span>
              )}
            </label>
          ))}
          {vehicles.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">{tr("noVehicles")}</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {noneSelected
            ? tr("noVehiclesSelected")
            : allSelected
            ? tr("noRestriction")
            : `${selected.size} ${tr("of")} ${vehicles.length} ${tr("vehiclesSelected")}`}
        </p>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <DialogFooter>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading || noneSelected}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : tr("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
