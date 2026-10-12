CREATE TYPE "InventoryMovementType" AS ENUM ('IN', 'OUT', 'RETURN');

ALTER TABLE "InventoryStockEntry"
    ALTER COLUMN "supplier" DROP NOT NULL,
    ADD COLUMN "movementType" "InventoryMovementType" NOT NULL DEFAULT 'IN',
    ADD COLUMN "dispatchedTo" TEXT,
    ADD COLUMN "notes" TEXT;

CREATE INDEX "InventoryStockEntry_itemId_movementType_entryDate_idx"
    ON "InventoryStockEntry"("itemId", "movementType", "entryDate");

INSERT INTO "InventoryStockEntry" (
    "itemId",
    "quantity",
    "movementType",
    "entryDate",
    "pricePerUnit",
    "dispatchedTo",
    "notes"
)
SELECT
    dispatch."itemId",
    dispatch."quantity",
    'OUT',
    dispatch."dispatchedAt",
    item."pricePerUnit",
    customer."fullName",
    concat_ws(
        ' · ',
        NULLIF(BTRIM(dispatch."notes"), ''),
        'Historical dispatch rate uses current item rate'
    )
FROM "DispatchRecord" AS dispatch
JOIN "Inventory" AS item ON item."id" = dispatch."itemId"
JOIN "Customer" AS customer ON customer."id" = dispatch."customerId";
