/*
  Warnings:

  - You are about to drop the column `province` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `province` on the `XrayScan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "province";

-- AlterTable
ALTER TABLE "XrayScan" DROP COLUMN "province";
