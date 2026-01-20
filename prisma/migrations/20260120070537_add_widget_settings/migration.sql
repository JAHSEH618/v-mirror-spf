-- CreateTable
CREATE TABLE "WidgetSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "WidgetSettings_shop_key" ON "WidgetSettings"("shop");
