import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma.js";
import {
  uploadToR2,
  generateObjectKey,
  isR2Configured,
  getR2Status,
} from "../src/services/r2StorageService.js";
import { env } from "../src/config/env.js";

interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
  skipped: number;
  errors: Array<{ id: string; url: string; error: string }>;
}

async function migrateLocalImagesToR2() {
  console.log("=== R2 Migration Script ===");
  console.log("Starting migration of local images to Cloudflare R2...\n");

  // Check R2 configuration
  console.log("Checking R2 configuration...");
  const r2Status = getR2Status();
  console.log("R2 Status:", JSON.stringify(r2Status, null, 2));

  if (!isR2Configured()) {
    console.error("\n❌ ERROR: R2 is not configured. Please set the following environment variables:");
    console.error("  - R2_ACCOUNT_ID");
    console.error("  - R2_ACCESS_KEY_ID");
    console.error("  - R2_SECRET_ACCESS_KEY");
    console.error("  - R2_BUCKET_NAME");
    console.error("  - R2_ENDPOINT");
    process.exit(1);
  }

  console.log("✅ R2 is configured and ready.\n");

  // Get all TaskImage records with local URLs
  console.log("Fetching TaskImage records with local URLs...");
  const taskImages = await prisma.taskImage.findMany({
    where: {
      url: {
        startsWith: "/uploads/",
      },
      objectKey: null, // Only migrate records without R2 objectKey
    },
  });

  console.log(`Found ${taskImages.length} local images to migrate.\n`);

  if (taskImages.length === 0) {
    console.log("No local images to migrate. Exiting.");
    return;
  }

  const stats: MigrationStats = {
    total: taskImages.length,
    migrated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Migrate each image
  for (const image of taskImages) {
    try {
      console.log(`[${stats.migrated + stats.failed + 1}/${stats.total}] Processing image ID: ${image.id}`);

      // Check if local file exists
      const localPath = image.url.replace("/uploads/", "");
      const fullPath = path.join(process.cwd(), "uploads", localPath);

      if (!fs.existsSync(fullPath)) {
        console.log(`  ⚠️  Local file not found: ${fullPath}`);
        console.log(`  ⏭️  Skipping this image\n`);
        stats.skipped++;
        continue;
      }

      // Read file
      console.log(`  📖 Reading file: ${fullPath}`);
      const fileBuffer = fs.readFileSync(fullPath);
      const fileStats = fs.statSync(fullPath);

      // Determine MIME type from file extension
      const ext = path.extname(fullPath).toLowerCase();
      const mimeTypeMap: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
      };
      const mimeType = mimeTypeMap[ext] || "image/jpeg";

      // Generate object key
      const objectKey = generateObjectKey(
        {
          taskId: image.taskId,
          type: image.type as "before" | "after" | "site-visit",
        },
        path.basename(fullPath)
      );

      console.log(`  📤 Uploading to R2: ${objectKey}`);

      // Upload to R2
      const uploadResult = await uploadToR2(
        fileBuffer,
        objectKey,
        mimeType,
        path.basename(fullPath)
      );

      // Update database record
      await prisma.taskImage.update({
        where: { id: image.id },
        data: {
          url: uploadResult.url,
          objectKey: uploadResult.objectKey,
          fileName: uploadResult.fileName,
          mimeType: uploadResult.mimeType,
          fileSize: uploadResult.fileSize,
        },
      });

      console.log(`  ✅ Successfully migrated to R2`);
      console.log(`     New URL: ${uploadResult.url}`);
      console.log(`     Object Key: ${uploadResult.objectKey}\n`);

      stats.migrated++;
    } catch (error) {
      console.error(`  ❌ Failed to migrate image ID: ${image.id}`);
      console.error(`     Error: ${error instanceof Error ? error.message : String(error)}\n`);
      stats.failed++;
      stats.errors.push({
        id: image.id,
        url: image.url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Print summary
  console.log("\n=== Migration Summary ===");
  console.log(`Total images: ${stats.total}`);
  console.log(`✅ Migrated: ${stats.migrated}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`⏭️  Skipped: ${stats.skipped}`);

  if (stats.errors.length > 0) {
    console.log("\n=== Failed Images ===");
    stats.errors.forEach((err) => {
      console.log(`ID: ${err.id}`);
      console.log(`URL: ${err.url}`);
      console.log(`Error: ${err.error}\n`);
    });
  }

  if (stats.migrated > 0) {
    console.log("\n✅ Migration completed successfully!");
    console.log("⚠️  IMPORTANT: Local files are still preserved in uploads/ directory.");
    console.log("⚠️  After verifying R2 uploads are working, you may delete local files manually.");
  } else if (stats.failed === stats.total) {
    console.log("\n❌ Migration failed for all images. Please check the errors above.");
    process.exit(1);
  } else {
    console.log("\n⚠️  Migration completed with some failures. Please review the errors above.");
  }
}

// Run migration
migrateLocalImagesToR2()
  .then(() => {
    console.log("\n=== Migration Script Finished ===");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n=== Migration Script Failed ===");
    console.error(error);
    process.exit(1);
  });
