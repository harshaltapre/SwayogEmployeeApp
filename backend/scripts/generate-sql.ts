import { execSync } from "child_process";
import fs from "fs";
import path from "path";

async function generate() {
  console.log("Generating complete SQL DDL schema from Prisma datamodel...");

  // Generate DDL statements from Prisma datamodel
  const ddl = execSync(
    "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
    { encoding: "utf-8" }
  );

  // Initial Seed Data SQL Insert statements
  const seedSql = `

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- 1. Insert Default Super Admin User (Email: harshaltapre27@gmail.com | Password: Harshal.27)
INSERT INTO "User" ("id", "loginId", "email", "fullName", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
VALUES (
  '1456e267-87e7-46a7-98f0-3ca5cf783acf',
  'SADM-001',
  'harshaltapre27@gmail.com',
  'Harshal Tapre',
  '$2a$10$UMPcrjblcx0XE282xGN/tu9SPqyCnt0eq/ISN.8n8eb0JA25xZOMe',
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW()
) ON CONFLICT ("email") DO NOTHING;

-- 2. Insert Default Inventory Catalog Items
INSERT INTO "Inventory" ("sku", "name", "category", "inStock", "minThreshold", "supplier", "pricePerUnit", "updatedAt")
VALUES
  ('ER-3M', 'Earthing Rod with Nut Bolts 3m', 'Earthing', 100, 10, 'Swayog Internal', 0, NOW()),
  ('EDC-16-GR', 'Earthing Down Conductor 16 sq mm Green', 'Earthing', 100, 10, 'Swayog Internal', 0, NOW()),
  ('EPC-FRP', 'Earthing Pit Cover FRP', 'Earthing', 100, 10, 'Swayog Internal', 0, NOW()),
  ('EBFC-25KG', 'Earthing Backfill Compound 25 Kg Bag', 'Earthing', 100, 10, 'Swayog Internal', 0, NOW()),
  ('LA-01', 'Lightning Arrestor', 'Protection', 100, 10, 'Swayog Internal', 0, NOW()),
  ('ACC-4-CU', 'AC Cable 1C x 4 sq mm Cu Flexible', 'Cables', 100, 10, 'Swayog Internal', 0, NOW()),
  ('DCC-4-RB', 'DC Cable 4 sq mm (Red & Black)', 'Cables', 100, 10, 'Swayog Internal', 0, NOW()),
  ('SP-2X2', 'Structure Pipe 2x2', 'Structure', 100, 10, 'Swayog Internal', 0, NOW()),
  ('SP-1.5X1.5', 'Structure Pipe 1.5x1.5', 'Structure', 100, 10, 'Swayog Internal', 0, NOW()),
  ('SP-1X1', 'Structure Pipe 1x1', 'Structure', 100, 10, 'Swayog Internal', 0, NOW()),
  ('BP-01', 'Base Plate', 'Structure', 100, 10, 'Swayog Internal', 0, NOW()),
  ('AB-01', 'Anchor Bolts', 'Hardware', 100, 10, 'Swayog Internal', 0, NOW()),
  ('MR-01', 'Monorail', 'Structure', 100, 10, 'Swayog Internal', 0, NOW()),
  ('MC-01', 'Mid Clamp', 'Hardware', 100, 10, 'Swayog Internal', 0, NOW()),
  ('EC-01', 'End Clamp', 'Hardware', 100, 10, 'Swayog Internal', 0, NOW()),
  ('RV-01', 'Rivet', 'Hardware', 100, 10, 'Swayog Internal', 0, NOW()),
  ('SB-01', 'Silicon Bottle', 'Chemicals', 100, 10, 'Swayog Internal', 0, NOW()),
  ('CP-25', 'Conduit Pipe 25 mm', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('MC-25-PVC', 'Mounting Clamps 25 mm PVC', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('EL-25', '25 mm Elbow', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('T-25', '25 mm T', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('EIT-01', 'Electrical Insulation Tape', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('CT-PKT', 'Cable Tie Packet', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('FC-1IN', 'Flexible Conduit – 1 inch', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('JB-SS', 'J Bolt SS with Single Washer and Nut', 'Hardware', 100, 10, 'Swayog Internal', 0, NOW()),
  ('MC4-PR', 'MC4 Connector Pair', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('INV-01', 'Inverter', 'Electronics', 100, 10, 'Swayog Internal', 0, NOW()),
  ('DCR-PNL', 'DCR Panel', 'Electronics', 100, 10, 'Swayog Internal', 0, NOW()),
  ('ACDB-01', 'ACDB', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('DCDB-01', 'DCDB', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('WPL-SB', 'Waterproofing Liquid (small bottle)', 'Chemicals', 100, 10, 'Swayog Internal', 0, NOW()),
  ('DB-01', 'Dewalt Bottle', 'Tools', 100, 10, 'Swayog Internal', 0, NOW()),
  ('PVCD-01', 'PVC Duct', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW())
ON CONFLICT ("sku") DO NOTHING;

-- 3. Insert Initial Active AMC Customers
INSERT INTO "Customer" ("customerCode", "fullName", "email", "phoneNumber", "city", "address", "systemSizeKw", "installationDate", "amcStatus", "clientType", "consumerNumber", "monthlyCleaningRate", "cleaningsPerMonth", "updatedAt")
VALUES
  ('CUST-001', 'Anil Sharma', 'anil.sharma@example.com', '9876543210', 'Pune', 'Flat 401, Sapphire Heights, Baner, Pune', 5.0, NOW(), 'ACTIVE', 'post_paid', 'CON-1002345', 1500, 2, NOW()),
  ('CUST-002', 'Rajesh Patel', 'rajesh.patel@example.com', '9123456780', 'Mumbai', 'B-12, Green Glen Layout, Andheri East, Mumbai', 10.0, NOW(), 'ACTIVE', 'pre_paid', 'CON-2004567', 2500, 3, NOW()),
  ('CUST-003', 'Meera Nair', 'meera.nair@example.com', '9345678901', 'Bangalore', '42, Sunrise Villa, HSR Layout, Bangalore', 8.0, NOW(), 'ACTIVE', 'corporate', 'CON-3007890', 3500, 1, NOW())
ON CONFLICT ("customerCode") DO NOTHING;
`;

  const header = `-- ============================================================================
-- SWAYOG ENERGY DASHBOARD - COMPLETE POSTGRESQL DATABASE SETUP SCRIPT
-- Generated for PostgreSQL / Neon DB / Supabase / Local Postgres
-- Includes: Enums, Tables, Primary Keys, Foreign Keys, Indexes, & Initial Data
-- ============================================================================

`;

  const fullContent = header + ddl + seedSql;

  // Save to backend/database.sql, backend/schema.sql, and root database.sql
  const backendDbSql = path.join(process.cwd(), "database.sql");
  const backendSchemaSql = path.join(process.cwd(), "schema.sql");
  const rootDbSql = path.join(process.cwd(), "..", "database.sql");

  fs.writeFileSync(backendDbSql, fullContent, "utf-8");
  fs.writeFileSync(backendSchemaSql, fullContent, "utf-8");
  fs.writeFileSync(rootDbSql, fullContent, "utf-8");

  console.log(`✅ Success! Generated full SQL setup scripts:`);
  console.log(`   - ${backendDbSql}`);
  console.log(`   - ${backendSchemaSql}`);
  console.log(`   - ${rootDbSql}`);
}

generate().catch((e) => {
  console.error("Error generating SQL:", e);
  process.exit(1);
});
