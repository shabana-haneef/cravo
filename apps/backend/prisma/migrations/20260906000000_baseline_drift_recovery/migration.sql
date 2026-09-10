-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('ORDER_PLACED', 'ORDER_STATUS_UPDATED', 'ORDER_CANCELLED', 'SELLER_APPROVED', 'SELLER_REJECTED', 'PRODUCT_APPROVED', 'PRODUCT_REJECTED');

-- CreateEnum
CREATE TYPE "public"."CampaignType" AS ENUM ('PRODUCT_PROMOTION', 'STOREWIDE_OFFER', 'DISCOUNT_CAMPAIGN', 'FLASH_SALE');

-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."DeliveryStatus" ADD VALUE 'NOT_CREATED';
ALTER TYPE "public"."DeliveryStatus" ADD VALUE 'CREATING';
ALTER TYPE "public"."DeliveryStatus" ADD VALUE 'CREATED';
ALTER TYPE "public"."DeliveryStatus" ADD VALUE 'PICKUP_SCHEDULED';
ALTER TYPE "public"."DeliveryStatus" ADD VALUE 'READY_FOR_PICKUP';
ALTER TYPE "public"."DeliveryStatus" ADD VALUE 'NDR';
ALTER TYPE "public"."DeliveryStatus" ADD VALUE 'RTO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."OrderStatus" ADD VALUE 'PAID';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'SELLER_ACCEPTED';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'SELLER_REJECTED';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'SHIPPED';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'RETURN_REQUESTED';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'RETURNED';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'RTO';

-- AlterEnum
ALTER TYPE "public"."SellerDocumentType" ADD VALUE 'FSSAI_LICENSE';

-- DropIndex
DROP INDEX "public"."Product_slug_idx";

-- DropIndex
DROP INDEX "public"."product_desc_trgm_idx";

-- DropIndex
DROP INDEX "public"."product_name_trgm_idx";

-- DropIndex
DROP INDEX "public"."Shop_sellerId_idx";

-- DropIndex
DROP INDEX "public"."Shop_slug_idx";

-- DropIndex
DROP INDEX "public"."User_email_idx";

-- DropIndex
DROP INDEX "public"."WishlistItem_userId_idx";

-- AlterTable
ALTER TABLE "public"."AdPackage" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."AdPayment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."Category" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Delivery" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveryVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "outForDeliveryAt" TIMESTAMP(3),
ADD COLUMN     "pickedUpAt" TIMESTAMP(3),
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "shippingLabelUrl" TEXT,
ALTER COLUMN "status" SET DEFAULT 'NOT_CREATED';

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "delhiveryShipmentId" TEXT,
ADD COLUMN     "pickupRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shipmentCreated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shipmentCreatedAt" TIMESTAMP(3),
ADD COLUMN     "shipmentLogs" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "shippingLabelUrl" TEXT,
ADD COLUMN     "trackingStatus" TEXT NOT NULL DEFAULT 'pending',
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "deliveryCharge" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "grandTotal" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."OrderItem" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."Payment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "additionalInformation",
ADD COLUMN     "declaredValue" DECIMAL(65,30),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "ingredients" TEXT NOT NULL DEFAULT 'Not specified',
ADD COLUMN     "labelImagePublicId" TEXT,
ADD COLUMN     "labelImageUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."ProductVariant" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "weight" DOUBLE PRECISION,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "compareAtPrice" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."RefreshToken" ADD COLUMN     "replacedBy" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Seller" ADD COLUMN     "businessAddressLine1" TEXT,
ADD COLUMN     "businessAddressLine2" TEXT,
ADD COLUMN     "businessCity" TEXT,
ADD COLUMN     "businessCountry" TEXT,
ADD COLUMN     "businessHours" JSONB,
ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "businessPincode" TEXT,
ADD COLUMN     "businessState" TEXT,
ADD COLUMN     "businessType" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "fssaiNumber" TEXT,
ADD COLUMN     "pickupAddress" TEXT,
ADD COLUMN     "pickupCity" TEXT,
ADD COLUMN     "pickupLocationName" TEXT,
ADD COLUMN     "pickupPhone" TEXT,
ADD COLUMN     "pickupPincode" TEXT,
ADD COLUMN     "pickupState" TEXT,
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "storeDescription" TEXT,
ADD COLUMN     "storeName" TEXT,
ADD COLUMN     "storeWebsite" TEXT,
ADD COLUMN     "supportEmail" TEXT,
ADD COLUMN     "supportPhone" TEXT;

-- AlterTable
ALTER TABLE "public"."Shop" ADD COLUMN     "businessHours" JSONB,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "supportEmail" TEXT,
ADD COLUMN     "supportPhone" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."BankAccount" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifsc" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderShipmentLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "awbNumber" TEXT,
    "shipmentId" TEXT,
    "remarks" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderShipmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderEmails" BOOLEAN NOT NULL DEFAULT true,
    "inventoryAlerts" BOOLEAN NOT NULL DEFAULT true,
    "payoutEmails" BOOLEAN NOT NULL DEFAULT true,
    "securityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionType" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "endpoint" TEXT,
    "requestMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "targetName" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IntegrationLog" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Campaign" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."CampaignType" NOT NULL,
    "status" "public"."CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "bannerUrl" TEXT,
    "bannerPublicId" TEXT,
    "destinationUrl" TEXT,
    "targetProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "budget" DECIMAL(65,30) NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CampaignAnalytics" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "spend" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ordersGenerated" INTEGER NOT NULL DEFAULT 0,
    "revenueGenerated" DECIMAL(65,30) NOT NULL DEFAULT 0.0,

    CONSTRAINT "CampaignAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CampaignPayment" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CampaignStatusHistory" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "status" "public"."CampaignStatus" NOT NULL,
    "reason" TEXT,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_sellerId_key" ON "public"."BankAccount"("sellerId");

-- CreateIndex
CREATE INDEX "BankAccount_sellerId_idx" ON "public"."BankAccount"("sellerId");

-- CreateIndex
CREATE INDEX "OrderShipmentLog_orderId_idx" ON "public"."OrderShipmentLog"("orderId");

-- CreateIndex
CREATE INDEX "OrderShipmentLog_timestamp_idx" ON "public"."OrderShipmentLog"("timestamp");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "public"."Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "public"."NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "public"."AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_actionType_idx" ON "public"."AuditLog"("actionType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "IntegrationLog_service_idx" ON "public"."IntegrationLog"("service");

-- CreateIndex
CREATE INDEX "IntegrationLog_timestamp_idx" ON "public"."IntegrationLog"("timestamp");

-- CreateIndex
CREATE INDEX "Campaign_sellerId_idx" ON "public"."Campaign"("sellerId");

-- CreateIndex
CREATE INDEX "Campaign_shopId_idx" ON "public"."Campaign"("shopId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "public"."Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_status_shopId_idx" ON "public"."Campaign"("status", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignAnalytics_campaignId_key" ON "public"."CampaignAnalytics"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignPayment_campaignId_key" ON "public"."CampaignPayment"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignPayment_razorpayOrderId_key" ON "public"."CampaignPayment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignPayment_razorpayPaymentId_key" ON "public"."CampaignPayment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "CampaignStatusHistory_campaignId_idx" ON "public"."CampaignStatusHistory"("campaignId");

-- CreateIndex
CREATE INDEX "Advertisement_packageId_idx" ON "public"."Advertisement"("packageId");

-- CreateIndex
CREATE INDEX "Cart_shopId_idx" ON "public"."Cart"("shopId");

-- CreateIndex
CREATE INDEX "CartItem_productId_idx" ON "public"."CartItem"("productId");

-- CreateIndex
CREATE INDEX "CartItem_productVariantId_idx" ON "public"."CartItem"("productVariantId");

-- CreateIndex
CREATE INDEX "Order_addressId_idx" ON "public"."Order"("addressId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "public"."OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "public"."OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_productVariantId_idx" ON "public"."OrderItem"("productVariantId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "public"."Payment"("orderId");

-- CreateIndex
CREATE INDEX "Product_status_categoryId_idx" ON "public"."Product"("status", "categoryId");

-- CreateIndex
CREATE INDEX "Product_status_shopId_idx" ON "public"."Product"("status", "shopId");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "public"."ProductImage"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "public"."ProductVariant"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "public"."User"("googleId");

-- AddForeignKey
ALTER TABLE "public"."BankAccount" ADD CONSTRAINT "BankAccount_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderShipmentLog" ADD CONSTRAINT "OrderShipmentLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Campaign" ADD CONSTRAINT "Campaign_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Campaign" ADD CONSTRAINT "Campaign_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CampaignAnalytics" ADD CONSTRAINT "CampaignAnalytics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CampaignPayment" ADD CONSTRAINT "CampaignPayment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CampaignStatusHistory" ADD CONSTRAINT "CampaignStatusHistory_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

