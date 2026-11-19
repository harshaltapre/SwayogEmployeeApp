-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "VendorBillStatus" AS ENUM ('DRAFT', 'AWAITING_APPROVAL', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "LedgerAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Vendor" (
    "id" TEXT NOT NULL,
    "vendorCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendorType" TEXT NOT NULL DEFAULT 'MATERIAL_SUPPLIER',
    "gstin" TEXT,
    "pan" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "ifscCode" TEXT,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tdsApplicable" BOOLEAN NOT NULL DEFAULT false,
    "defaultTdsRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "VendorBill" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "vendorInvoiceNo" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "purchaseOrderRef" TEXT,
    "grnRef" TEXT,
    "customerId" INTEGER,
    "zone" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Material Purchase',
    "supplyType" TEXT NOT NULL DEFAULT 'INTRA_STATE',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tdsRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tdsAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPayable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "itcEligible" BOOLEAN NOT NULL DEFAULT true,
    "billableToCustomer" BOOLEAN NOT NULL DEFAULT false,
    "status" "VendorBillStatus" NOT NULL DEFAULT 'DRAFT',
    "attachmentUrl" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "VendorBillItem" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "inventoryItemId" INTEGER,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "hsnSac" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" DOUBLE PRECISION,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxableValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "VendorBillItem_pkey" PRIMARY KEY ("id")
);

-- Fix VendorBillItem.unit type to TEXT
ALTER TABLE "VendorBillItem" ALTER COLUMN "unit" TYPE TEXT USING COALESCE("unit"::TEXT, 'unit');
ALTER TABLE "VendorBillItem" ALTER COLUMN "unit" SET DEFAULT 'unit';
ALTER TABLE "VendorBillItem" ALTER COLUMN "unit" SET NOT NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "VendorPayment" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "billId" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL,
    "tdsDeducted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMode" TEXT NOT NULL DEFAULT 'NEFT',
    "referenceNo" TEXT,
    "bankAccount" TEXT,
    "notes" TEXT,
    "proofUrl" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LedgerAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountType" "LedgerAccountType" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "JournalEntry" (
    "id" TEXT NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT,
    "description" TEXT NOT NULL,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedByEntryId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "JournalLine" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vendorId" TEXT,
    "customerId" INTEGER,
    "zone" TEXT,
    "memo" TEXT,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_vendorCode_key" ON "Vendor"("vendorCode");
CREATE INDEX IF NOT EXISTS "Vendor_name_idx" ON "Vendor"("name");
CREATE INDEX IF NOT EXISTS "Vendor_status_idx" ON "Vendor"("status");
CREATE INDEX IF NOT EXISTS "Vendor_vendorType_idx" ON "Vendor"("vendorType");

CREATE UNIQUE INDEX IF NOT EXISTS "VendorBill_billNumber_key" ON "VendorBill"("billNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "VendorBill_vendorId_vendorInvoiceNo_key" ON "VendorBill"("vendorId", "vendorInvoiceNo");
CREATE INDEX IF NOT EXISTS "VendorBill_vendorId_idx" ON "VendorBill"("vendorId");
CREATE INDEX IF NOT EXISTS "VendorBill_customerId_idx" ON "VendorBill"("customerId");
CREATE INDEX IF NOT EXISTS "VendorBill_status_idx" ON "VendorBill"("status");
CREATE INDEX IF NOT EXISTS "VendorBill_invoiceDate_idx" ON "VendorBill"("invoiceDate");
CREATE INDEX IF NOT EXISTS "VendorBill_dueDate_idx" ON "VendorBill"("dueDate");

CREATE INDEX IF NOT EXISTS "VendorBillItem_billId_idx" ON "VendorBillItem"("billId");

CREATE UNIQUE INDEX IF NOT EXISTS "VendorPayment_paymentNumber_key" ON "VendorPayment"("paymentNumber");
CREATE INDEX IF NOT EXISTS "VendorPayment_vendorId_idx" ON "VendorPayment"("vendorId");
CREATE INDEX IF NOT EXISTS "VendorPayment_billId_idx" ON "VendorPayment"("billId");
CREATE INDEX IF NOT EXISTS "VendorPayment_paymentDate_idx" ON "VendorPayment"("paymentDate");

CREATE UNIQUE INDEX IF NOT EXISTS "LedgerAccount_code_key" ON "LedgerAccount"("code");
CREATE INDEX IF NOT EXISTS "LedgerAccount_accountType_idx" ON "LedgerAccount"("accountType");

CREATE UNIQUE INDEX IF NOT EXISTS "JournalEntry_entryNumber_key" ON "JournalEntry"("entryNumber");
CREATE INDEX IF NOT EXISTS "JournalEntry_entryDate_idx" ON "JournalEntry"("entryDate");
CREATE INDEX IF NOT EXISTS "JournalEntry_referenceType_referenceId_idx" ON "JournalEntry"("referenceType", "referenceId");

CREATE INDEX IF NOT EXISTS "JournalLine_entryId_idx" ON "JournalLine"("entryId");
CREATE INDEX IF NOT EXISTS "JournalLine_accountId_idx" ON "JournalLine"("accountId");
CREATE INDEX IF NOT EXISTS "JournalLine_vendorId_idx" ON "JournalLine"("vendorId");
CREATE INDEX IF NOT EXISTS "JournalLine_customerId_idx" ON "JournalLine"("customerId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "VendorBillItem" ADD CONSTRAINT "VendorBillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES "VendorBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "VendorBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
