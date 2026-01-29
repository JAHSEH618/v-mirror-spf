-- CreateIndex
CREATE INDEX "BillingHistory_shop_date_idx" ON "BillingHistory"("shop", "date");

-- CreateIndex
CREATE INDEX "ProductStat_shop_tryOnCount_idx" ON "ProductStat"("shop", "tryOnCount");

-- CreateIndex
CREATE INDEX "UsageStat_shop_date_idx" ON "UsageStat"("shop", "date");
