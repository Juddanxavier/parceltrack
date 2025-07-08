-- CreateEnum
CREATE TYPE "TrackingStatus" AS ENUM (
  'PENDING',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'EXCEPTION',
  'RETURNED'
);

-- CreateTable
CREATE TABLE "shipment" (
    "id" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "carrier_tracking_number" TEXT,
    "carrier" TEXT,
    "status" "TrackingStatus" NOT NULL DEFAULT 'PENDING',
    "estimated_delivery" TIMESTAMP(3),
    "actual_delivery" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_event" (
    "id" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "status" "TrackingStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipment_tracking_number_key" ON "shipment"("tracking_number");

-- CreateIndex
CREATE INDEX "shipment_user_id_idx" ON "shipment"("user_id");

-- CreateIndex
CREATE INDEX "shipment_carrier_tracking_number_idx" ON "shipment"("carrier_tracking_number");

-- CreateIndex
CREATE INDEX "tracking_event_shipment_id_idx" ON "tracking_event"("shipment_id");

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_event" ADD CONSTRAINT "tracking_event_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
