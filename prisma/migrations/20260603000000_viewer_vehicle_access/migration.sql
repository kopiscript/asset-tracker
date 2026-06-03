-- CreateTable
CREATE TABLE "viewer_vehicle_access" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "vehicle_id" BIGINT NOT NULL,

    CONSTRAINT "viewer_vehicle_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "viewer_vehicle_access_member_id_vehicle_id_key" ON "viewer_vehicle_access"("member_id", "vehicle_id");

-- AddForeignKey
ALTER TABLE "viewer_vehicle_access" ADD CONSTRAINT "viewer_vehicle_access_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "org_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewer_vehicle_access" ADD CONSTRAINT "viewer_vehicle_access_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
