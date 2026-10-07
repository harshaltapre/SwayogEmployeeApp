CREATE TABLE "InventoryStockEntry" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryStockEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryStockEntry_itemId_entryDate_idx"
    ON "InventoryStockEntry"("itemId", "entryDate");

ALTER TABLE "InventoryStockEntry"
    ADD CONSTRAINT "InventoryStockEntry_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "Inventory"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "InventoryStockEntry" ("itemId", "quantity", "entryDate", "pricePerUnit", "supplier")
SELECT "id", "inStock", "entryDate", "pricePerUnit", COALESCE(NULLIF(BTRIM("supplier"), ''), 'Opening stock')
FROM "Inventory"
WHERE "inStock" > 0;
