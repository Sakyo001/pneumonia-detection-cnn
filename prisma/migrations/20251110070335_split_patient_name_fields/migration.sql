/*
  Warnings:

  - You are about to drop the column `name` on the `Patient` table. All the data in the column will be lost.
  - Added the required column `first_name` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add new columns as nullable first
ALTER TABLE "Patient" ADD COLUMN "first_name" TEXT;
ALTER TABLE "Patient" ADD COLUMN "middle_name" TEXT;
ALTER TABLE "Patient" ADD COLUMN "last_name" TEXT;

-- Step 2: Migrate existing data from 'name' column
-- Split name by spaces and distribute into first, middle, and last names
UPDATE "Patient" 
SET 
  "first_name" = CASE 
    WHEN POSITION(' ' IN "name") > 0 THEN SPLIT_PART("name", ' ', 1)
    ELSE "name"
  END,
  "middle_name" = CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY("name", ' '), 1) > 2 THEN 
      ARRAY_TO_STRING(ARRAY(
        SELECT UNNEST(STRING_TO_ARRAY("name", ' ')) AS part 
        OFFSET 1 LIMIT ARRAY_LENGTH(STRING_TO_ARRAY("name", ' '), 1) - 2
      ), ' ')
    ELSE NULL
  END,
  "last_name" = CASE 
    WHEN POSITION(' ' IN "name") > 0 THEN 
      SPLIT_PART("name", ' ', ARRAY_LENGTH(STRING_TO_ARRAY("name", ' '), 1))
    ELSE "name"
  END
WHERE "name" IS NOT NULL;

-- Step 3: Make first_name and last_name required (NOT NULL)
ALTER TABLE "Patient" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "Patient" ALTER COLUMN "last_name" SET NOT NULL;

-- Step 4: Drop the old 'name' column
ALTER TABLE "Patient" DROP COLUMN "name";
