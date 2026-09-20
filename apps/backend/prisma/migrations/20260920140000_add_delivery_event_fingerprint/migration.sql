-- AlterTable (E-Waybill fields already have a resolved migration entry, but columns were never applied to DB)
ALTER TABLE "public"."Delivery" ADD COLUMN     "ewaybillNumber" TEXT;
ALTER TABLE "public"."Delivery" ADD COLUMN     "returnEwaybillNumber" TEXT;

-- AlterTable (Fingerprint - new)
ALTER TABLE "public"."DeliveryTrackingEvent" ADD COLUMN     "fingerprint" TEXT;

-- CreateIndex (Fingerprint unique constraint - NULL-safe: Postgres treats each NULL as distinct so legacy rows are unaffected)
CREATE UNIQUE INDEX "DeliveryTrackingEvent_deliveryId_fingerprint_key" ON "public"."DeliveryTrackingEvent"("deliveryId", "fingerprint");
