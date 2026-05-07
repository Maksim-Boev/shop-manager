/*
  Warnings:

  - You are about to drop the column `openingHours` on the `Store` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Store" DROP COLUMN "openingHours",
ADD COLUMN     "weeklySchedule" JSONB;

-- CreateTable
CREATE TABLE "StoreScheduleException" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "year" INTEGER,
    "isOpen" BOOLEAN NOT NULL,
    "from" TEXT,
    "to" TEXT,
    "note" TEXT,

    CONSTRAINT "StoreScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreScheduleException_storeId_idx" ON "StoreScheduleException"("storeId");

-- CreateIndex
CREATE INDEX "StoreScheduleException_storeId_month_day_idx" ON "StoreScheduleException"("storeId", "month", "day");

-- AddForeignKey
ALTER TABLE "StoreScheduleException" ADD CONSTRAINT "StoreScheduleException_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
