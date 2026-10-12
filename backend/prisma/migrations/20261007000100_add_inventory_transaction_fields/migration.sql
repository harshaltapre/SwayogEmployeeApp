-- Add fields to support full inventory history audit trail
ALTER TABLE "InventoryStockEntry"
    ADD COLUMN IF NOT EXISTS "previousQuantity" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "newQuantity" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "transactionType" TEXT NOT NULL DEFAULT 'ADD',
    ADD COLUMN IF NOT EXISTS "remarks" TEXT,
    ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

UPDATE "InventoryStockEntry"
SET "newQuantity" = "quantity",
    "transactionType" = CASE 
      WHEN "movementType" = 'OUT' THEN 'REMOVE'
      WHEN "movementType" = 'RETURN' THEN 'RETURN'
      ELSE 'ADD'
    END
WHERE "newQuantity" = 0;
