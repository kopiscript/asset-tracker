-- ============================================================
-- Migration: Add Organisation & Fleet model
-- Run this in Neon Console → SQL Editor
-- ============================================================

-- 1. Drop old per-vehicle sharing table
DROP TABLE IF EXISTS vehicle_access CASCADE;

-- 2. Add new columns to vehicles
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS org_id TEXT,
  ADD COLUMN IF NOT EXISTS api_key TEXT;

-- 3. Remove direct owner column from vehicles (data is no longer needed)
ALTER TABLE vehicles
  DROP COLUMN IF EXISTS user_id;

-- 4. Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Org members (User <-> Organization with role)
CREATE TABLE IF NOT EXISTS org_members (
  id         TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id     TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

-- 6. Fleets
CREATE TABLE IF NOT EXISTS fleets (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  org_id     TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Fleet <-> Vehicle junction
CREATE TABLE IF NOT EXISTS fleet_vehicles (
  fleet_id   TEXT   NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  PRIMARY KEY (fleet_id, vehicle_id)
);

-- 8. Fleet members (which users can see which fleet)
CREATE TABLE IF NOT EXISTS fleet_members (
  fleet_id TEXT NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (fleet_id, user_id)
);

-- 9. Foreign key from vehicles to organizations
ALTER TABLE vehicles
  ADD CONSTRAINT fk_vehicles_org
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE SET NULL;
