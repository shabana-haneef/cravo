ALTER TABLE "public"."Order" ADD COLUMN "invoiceNumber" TEXT;
CREATE UNIQUE INDEX "Order_invoiceNumber_key" ON "public"."Order"("invoiceNumber");
