ALTER TABLE "Seller" ADD COLUMN "delhiveryPickupLocationId" TEXT;
ALTER TABLE "Seller" ADD COLUMN "delhiveryRegistrationStatus" TEXT NOT NULL DEFAULT 'PENDING';
