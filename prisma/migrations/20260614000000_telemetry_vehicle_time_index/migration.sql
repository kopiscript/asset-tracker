-- Index for efficient per-vehicle history queries filtering on timestamp_my.
-- The history and today-mileage queries both use: WHERE vehicle_id = ? AND timestamp_my >= ?
-- Without this, every such query scans all rows for the vehicle regardless of time range.
CREATE INDEX "idx_vehicle_time_my" ON "telemetry_records" ("vehicle_id", "timestamp_my" DESC);
