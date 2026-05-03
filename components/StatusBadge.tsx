/**
 * components/StatusBadge.tsx
 * Coloured badge showing a vehicle's operational status.
 * Green = Active, Yellow = Idle, Red = Offline.
 */
import { Badge } from "@/components/ui/badge";

type Status = "active" | "idle" | "offline";

interface StatusBadgeProps {
  status: Status | string;
}

const config: Record<string, { dot: string; badge: string; label: string }> = {
  active: {
    dot: "bg-green-500",
    badge:
      "bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/15",
    label: "Active",
  },
  idle: {
    dot: "bg-yellow-500",
    badge:
      "bg-yellow-500/15 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/15",
    label: "Idle",
  },
  offline: {
    dot: "bg-red-500",
    badge:
      "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/15",
    label: "Offline",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = config[status] ?? config.offline;
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 font-medium text-xs ${cfg.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.label}
    </Badge>
  );
}
