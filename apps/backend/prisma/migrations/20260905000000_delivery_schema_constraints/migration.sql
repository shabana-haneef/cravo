ALTER TABLE "public"."Delivery" ADD COLUMN "pickupRequestId" TEXT;
ALTER TABLE "public"."Delivery" ADD COLUMN "pickupDate" TEXT;
ALTER TABLE "public"."Delivery" ADD COLUMN "pickupSlot" TEXT;
ALTER TABLE "public"."Order" ADD COLUMN "awbNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_pickupRequestId_key" ON "public"."Delivery"("pickupRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_awbNumber_key" ON "public"."Order"("awbNumber");
