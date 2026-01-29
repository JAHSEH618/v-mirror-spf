-- CreateTable
CREATE TABLE "TryOnEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT,
    "sessionId" TEXT,
    "deviceType" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "referer" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "TryOnEvent_shop_productId_idx" ON "TryOnEvent"("shop", "productId");

-- CreateIndex
CREATE INDEX "TryOnEvent_shop_createdAt_idx" ON "TryOnEvent"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "TryOnEvent_sessionId_idx" ON "TryOnEvent"("sessionId");

-- CreateIndex
CREATE INDEX "TryOnEvent_shop_deviceType_idx" ON "TryOnEvent"("shop", "deviceType");
