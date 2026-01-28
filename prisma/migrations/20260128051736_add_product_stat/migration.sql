-- CreateTable
CREATE TABLE "ProductStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "productImage" TEXT,
    "tryOnCount" INTEGER NOT NULL DEFAULT 0,
    "addToCartCount" INTEGER NOT NULL DEFAULT 0,
    "lastTryOn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductStat_shop_productId_key" ON "ProductStat"("shop", "productId");
