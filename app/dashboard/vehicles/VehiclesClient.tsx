/**
 * app/dashboard/vehicles/VehiclesClient.tsx
 * Client component that renders the vehicle grid with search/filter controls.
 * Receives pre-fetched vehicles from the parent server component.
 */
"use client";

import { useState } from "react";
import { Search, Car } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VehicleCard, type VehicleCardData } from "@/components/dashboard/VehicleCard";
import { useLang } from "@/components/LanguageProvider";

interface VehiclesClientProps {
  initialVehicles: VehicleCardData[];
}

export function VehiclesClient({ initialVehicles }: VehiclesClientProps) {
  const { tr } = useLang();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter vehicles by search query and status
  const filtered = initialVehicles.filter((v) => {
    const matchesSearch =
      search === "" ||
      (v.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.plateNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.driverName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (initialVehicles.length === 0) {
    return (
      <div className="border border-border/50 rounded-xl overflow-hidden">
        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
          <div className="h-14 w-14 rounded-2xl bg-muted/60 border border-border/40 flex items-center justify-center mb-5">
            <Car className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No vehicles yet</p>
          <p className="text-sm text-muted-foreground max-w-[36ch]">
            Add your first GPS device to start tracking your fleet on the live map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, plate, or driver…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-full sm:w-40 bg-card border-border/50">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">{tr("statusActive")}</SelectItem>
            <SelectItem value="idle">{tr("statusIdle")}</SelectItem>
            <SelectItem value="offline">{tr("statusOffline")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-border/50 rounded-xl py-16 text-center text-sm text-muted-foreground">
          No vehicles match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  );
}
