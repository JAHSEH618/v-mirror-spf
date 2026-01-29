-- CreateTable
CREATE TABLE "UploadTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "cdnUrl" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadTask_taskId_key" ON "UploadTask"("taskId");

-- CreateIndex
CREATE INDEX "UploadTask_taskId_idx" ON "UploadTask"("taskId");

-- CreateIndex
CREATE INDEX "UploadTask_shop_status_idx" ON "UploadTask"("shop", "status");

-- CreateIndex
CREATE INDEX "UploadTask_createdAt_idx" ON "UploadTask"("createdAt");
