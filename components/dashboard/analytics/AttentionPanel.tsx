"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import type { TranslationKey } from "@/lib/translations";

export interface AttentionItem {
  vehicleId: string;
  vehicleName: string;
  severity: "critical" | "warning";
  reasonKey: TranslationKey;
  detail: string;
}

const SEVERITY_STYLE: Record<AttentionItem["severity"], string> = {
  critical: "bg-red-500/10 text-red-300 border-red-500/20",
  warning: "bg-amber-500/10 text-amber-300 border-amber-500/20",
};

export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  const { tr } = useLang();

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-4">
        <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground leading-none mb-1">{tr("allClear")}</p>
          <p className="text-xs text-muted-foreground leading-snug">{tr("allClearDesc")}</p>
        </div>
      </div>
    );
  }

  const sorted = [...items].sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1
  );

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 border-b border-border/60">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
          {tr("attentionNeeded")}
        </span>
        <span className="ml-auto text-xs font-medium tabular-nums text-muted-foreground">
          {sorted.length}
        </span>
      </div>
      <div className="max-h-[220px] overflow-y-auto divide-y divide-border/50">
        {sorted.map((item, i) => (
          <Link
            key={`${item.vehicleId}-${item.reasonKey}-${i}`}
            href={`/dashboard/vehicles/${item.vehicleId}`}
            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-secondary/40 transition-colors group"
          >
            <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${SEVERITY_STYLE[item.severity]}`}>
              {item.detail}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate leading-none mb-0.5">
                {item.vehicleName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate leading-none">
                {tr(item.reasonKey)}
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
