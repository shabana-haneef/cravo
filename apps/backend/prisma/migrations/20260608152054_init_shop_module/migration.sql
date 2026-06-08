-- CreateEnum
CREATE TYPE "public"."ShopType" AS ENUM ('HOME_MADE', 'FARMER', 'BAKERY', 'GROCERY', 'FISH_SELLER', 'MEAT_SELLER', 'LOCAL_SHOP', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ShopStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "public"."Shop" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "logoPublicId" TEXT,
    "bannerUrl" TEXT,
    "bannerPublicId" TEXT,
    "shopType" "public"."ShopType" NOT NULL,
    "deliveryRadiusKm" INTEGER NOT NULL DEFAULT 5,
    "isPickupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isDeliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" "public"."ShopStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShopTiming" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "dayOfWeek" "public"."DayOfWeek" NOT NULL,
    "openTime" TEXT,
    "closeTime" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ShopTiming_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_sellerId_key" ON "public"."Shop"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_slug_key" ON "public"."Shop"("slug");

-- CreateIndex
CREATE INDEX "Shop_slug_idx" ON "public"."Shop"("slug");

-- CreateIndex
CREATE INDEX "Shop_sellerId_idx" ON "public"."Shop"("sellerId");

-- CreateIndex
CREATE INDEX "Shop_status_idx" ON "public"."Shop"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ShopTiming_shopId_dayOfWeek_key" ON "public"."ShopTiming"("shopId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "public"."Shop" ADD CONSTRAINT "Shop_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopTiming" ADD CONSTRAINT "ShopTiming_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
