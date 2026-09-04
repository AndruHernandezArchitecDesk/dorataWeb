-- Add missing image column to Product (was added to schema but not migrated to Neon)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "image" TEXT;
