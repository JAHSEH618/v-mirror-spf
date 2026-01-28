-- CreateTable
CREATE TABLE "BillingInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "planName" TEXT NOT NULL DEFAULT 'Free Plan',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "usageLimit" INTEGER NOT NULL DEFAULT 10,
    "currentUsage" INTEGER NOT NULL DEFAULT 0,
    "cycleStartDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentType" TEXT DEFAULT 'CREDIT_CARD',
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "cardExpiry" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BillingHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "invoiceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UsageStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingInfo_shop_key" ON "BillingInfo"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "UsageStat_shop_date_key" ON "UsageStat"("shop", "date");
