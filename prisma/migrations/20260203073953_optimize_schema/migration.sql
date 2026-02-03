-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('PAID', 'PENDING', 'FAILED');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WidgetSettings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "position" TEXT NOT NULL DEFAULT 'bottom-right',
    "horizontalOffset" INTEGER NOT NULL DEFAULT 20,
    "verticalOffset" INTEGER NOT NULL DEFAULT 20,
    "primaryColor" TEXT NOT NULL DEFAULT '#7C3AED',
    "textColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "logoUrl" TEXT,
    "buttonText" TEXT NOT NULL DEFAULT 'Try It On',
    "tooltipText" TEXT NOT NULL DEFAULT 'See how it looks on you!',
    "modalTitle" TEXT NOT NULL DEFAULT 'AI Virtual Try-On',
    "uploadInstructions" TEXT NOT NULL DEFAULT 'Upload a full-body photo for best results',
    "smartDetection" BOOLEAN NOT NULL DEFAULT false,
    "showOnMobile" BOOLEAN NOT NULL DEFAULT true,
    "animationStyle" TEXT NOT NULL DEFAULT 'fade-in',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WidgetSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingHistory" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "BillingStatus" NOT NULL DEFAULT 'PAID',
    "invoiceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageStat" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL DEFAULT 0,
    "desktopCount" INTEGER NOT NULL DEFAULT 0,
    "mobileCount" INTEGER NOT NULL DEFAULT 0,
    "tabletCount" INTEGER NOT NULL DEFAULT 0,
    "unknownDeviceCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UsageStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStat" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "productImage" TEXT,
    "tryOnCount" INTEGER NOT NULL DEFAULT 0,
    "addToCartCount" INTEGER NOT NULL DEFAULT 0,
    "orderedCount" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "lastTryOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TryOnEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT,
    "sessionId" TEXT,
    "fingerprintId" TEXT,
    "deviceType" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "referer" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryOnEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadTask" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "cdnUrl" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UploadTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSubscription" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "planName" TEXT NOT NULL DEFAULT 'Free Plan',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "usageLimit" INTEGER NOT NULL DEFAULT 10,
    "currentUsage" INTEGER NOT NULL DEFAULT 0,
    "cycleStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cycleEndDate" TIMESTAMP(3),
    "paymentMethod" TEXT DEFAULT 'SHOPIFY_BILLING',
    "lastSyncTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_shop_idx" ON "Session"("shop");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WidgetSettings_shop_key" ON "WidgetSettings"("shop");

-- CreateIndex
CREATE INDEX "BillingHistory_shop_date_idx" ON "BillingHistory"("shop", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UsageStat_shop_date_key" ON "UsageStat"("shop", "date");

-- CreateIndex
CREATE INDEX "ProductStat_shop_tryOnCount_idx" ON "ProductStat"("shop", "tryOnCount");

-- CreateIndex
CREATE UNIQUE INDEX "ProductStat_shop_productId_key" ON "ProductStat"("shop", "productId");

-- CreateIndex
CREATE INDEX "TryOnEvent_shop_productId_idx" ON "TryOnEvent"("shop", "productId");

-- CreateIndex
CREATE INDEX "TryOnEvent_shop_createdAt_idx" ON "TryOnEvent"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "TryOnEvent_createdAt_idx" ON "TryOnEvent"("createdAt");

-- CreateIndex
CREATE INDEX "TryOnEvent_sessionId_idx" ON "TryOnEvent"("sessionId");

-- CreateIndex
CREATE INDEX "TryOnEvent_shop_deviceType_idx" ON "TryOnEvent"("shop", "deviceType");

-- CreateIndex
CREATE UNIQUE INDEX "UploadTask_taskId_key" ON "UploadTask"("taskId");

-- CreateIndex
CREATE INDEX "UploadTask_shop_status_idx" ON "UploadTask"("shop", "status");

-- CreateIndex
CREATE INDEX "UploadTask_createdAt_idx" ON "UploadTask"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_webhookId_key" ON "WebhookEvent"("webhookId");

-- CreateIndex
CREATE INDEX "WebhookEvent_shop_topic_idx" ON "WebhookEvent"("shop", "topic");

-- CreateIndex
CREATE INDEX "WebhookEvent_createdAt_idx" ON "WebhookEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShopSubscription_shopId_key" ON "ShopSubscription"("shopId");

-- AddForeignKey
ALTER TABLE "WidgetSettings" ADD CONSTRAINT "WidgetSettings_shop_fkey" FOREIGN KEY ("shop") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingHistory" ADD CONSTRAINT "BillingHistory_shop_fkey" FOREIGN KEY ("shop") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageStat" ADD CONSTRAINT "UsageStat_shop_fkey" FOREIGN KEY ("shop") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStat" ADD CONSTRAINT "ProductStat_shop_fkey" FOREIGN KEY ("shop") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnEvent" ADD CONSTRAINT "TryOnEvent_shop_fkey" FOREIGN KEY ("shop") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadTask" ADD CONSTRAINT "UploadTask_shop_fkey" FOREIGN KEY ("shop") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_shop_fkey" FOREIGN KEY ("shop") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopSubscription" ADD CONSTRAINT "ShopSubscription_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
