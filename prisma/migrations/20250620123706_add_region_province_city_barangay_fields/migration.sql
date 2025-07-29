-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "barangay" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "region" TEXT;

-- AlterTable
ALTER TABLE "XrayScan" ADD COLUMN     "barangay" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "region" TEXT;
