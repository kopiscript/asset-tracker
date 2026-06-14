-- Baseline migration — reflects the actual current schema.
-- The original init was from an earlier version of the app and is no longer valid.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "usertype" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(6) DEFAULT now(),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Organizations
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "plan_expires_at" TIMESTAMP(3),
    "billplz_sub_id" TEXT,
    "grace_period_ends_at" TIMESTAMP(3),
    "name_set_at" TIMESTAMP(3),
    "onboarding_skipped_at" TIMESTAMP(3),
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- Org members
CREATE TABLE "org_members" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "org_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seen_welcome_at" TIMESTAMP(3),
    CONSTRAINT "org_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "org_members_userId_orgId_key" ON "org_members"("user_id", "org_id");

-- Vehicles
CREATE TABLE "vehicles" (
    "id" BIGSERIAL NOT NULL,
    "imei" TEXT NOT NULL,
    "vehicle_name" TEXT,
    "plate_number" TEXT,
    "model" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT now(),
    "driver_name" TEXT,
    "org_id" TEXT,
    "api_key" TEXT,
    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vehicles_imei_key" ON "vehicles"("imei");

-- Telemetry records
CREATE TABLE "telemetry_records" (
    "id" BIGSERIAL NOT NULL,
    "vehicle_id" BIGINT NOT NULL,
    "imei" TEXT NOT NULL,
    "timestamp_utc" TIMESTAMP(6) NOT NULL,
    "timestamp_my" TIMESTAMP(6) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "angle" DOUBLE PRECISION,
    "speed_kmh" DOUBLE PRECISION,
    "satellites" INTEGER,
    "priority" INTEGER,
    "ignition" INTEGER,
    "movement" INTEGER,
    "gnss_fix_type" INTEGER,
    "gnss_status" INTEGER,
    "gsm_signal" INTEGER,
    "gsm_operator" TEXT,
    "network_type" INTEGER,
    "external_voltage" DOUBLE PRECISION,
    "battery_voltage" DOUBLE PRECISION,
    "battery_current" DOUBLE PRECISION,
    "battery_percent" INTEGER,
    "sleep_mode" INTEGER,
    "data_mode" INTEGER,
    "crash_event" INTEGER,
    "ble_data" INTEGER,
    "speed_alt" DOUBLE PRECISION,
    "car_state" INTEGER,
    "car_battery_voltage" DOUBLE PRECISION,
    "gnss_raw" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(6) DEFAULT now(),
    CONSTRAINT "telemetry_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_imei_time" ON "telemetry_records"("imei", "timestamp_utc" DESC);

-- Org invites
CREATE TABLE "org_invites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "invited_by" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "org_invites_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "org_invites_token_key" ON "org_invites"("token");
CREATE UNIQUE INDEX "org_invites_email_orgId_key" ON "org_invites"("email", "org_id");

-- Foreign keys
ALTER TABLE "org_members"
    ADD CONSTRAINT "org_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "org_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vehicles"
    ADD CONSTRAINT "vehicles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "telemetry_records"
    ADD CONSTRAINT "telemetry_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "org_invites"
    ADD CONSTRAINT "org_invites_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "org_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
