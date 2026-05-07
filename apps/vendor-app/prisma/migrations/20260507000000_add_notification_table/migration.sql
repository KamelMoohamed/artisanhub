-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "vendorHandle" TEXT,
    "summary" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Notification_shop_topic_idx" ON "Notification"("shop", "topic");

-- CreateIndex
CREATE INDEX "Notification_shop_createdAt_idx" ON "Notification"("shop", "createdAt");
