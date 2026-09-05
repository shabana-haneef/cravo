-- CreateIndex
CREATE UNIQUE INDEX "Delivery_pickupRequestId_key" ON "public"."Delivery"("pickupRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_awbNumber_key" ON "public"."Order"("awbNumber");

