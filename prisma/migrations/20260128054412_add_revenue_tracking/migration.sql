-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "productImage" TEXT,
    "tryOnCount" INTEGER NOT NULL DEFAULT 0,
    "addToCartCount" INTEGER NOT NULL DEFAULT 0,
    "orderedCount" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0.0,
    "lastTryOn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ProductStat" ("addToCartCount", "id", "lastTryOn", "productId", "productImage", "productTitle", "shop", "tryOnCount", "updatedAt") SELECT "addToCartCount", "id", "lastTryOn", "productId", "productImage", "productTitle", "shop", "tryOnCount", "updatedAt" FROM "ProductStat";
DROP TABLE "ProductStat";
ALTER TABLE "new_ProductStat" RENAME TO "ProductStat";
CREATE UNIQUE INDEX "ProductStat_shop_productId_key" ON "ProductStat"("shop", "productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
