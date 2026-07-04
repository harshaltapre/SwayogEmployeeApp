import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { GrowattApiClient } from "../../lib/growatt-api.js";

/**
 * Validates, encrypts, and registers a Growatt OpenAPI V1 token.
 * Automatically provisions all physical plants associated with that token.
 * POST /api/v1/subadmin/growatt/credentials
 */
export async function saveGrowattCredentials(req: Request, res: Response): Promise<void> {
  const { customerName, apiToken } = req.body;

  if (!customerName || !customerName.trim()) {
    res.status(400).json({ error: "Customer/Client Name is required" });
    return;
  }

  if (!apiToken || !apiToken.trim()) {
    res.status(400).json({ error: "API Token is required" });
    return;
  }

  try {
    console.log(`[Growatt Controller] Registering Growatt credentials for client: "${customerName}"`);
    
    // Auto-provision plants and run initial synchronization
    const provisionedPlants = await GrowattApiClient.syncPlant(customerName.trim(), apiToken.trim());
    
    // Exclude the encrypted token from the response payload for maximum security isolation
    const safePlants = provisionedPlants.map(({ apiToken, ...rest }) => rest);

    res.status(200).json({
      success: true,
      message: `Successfully provisioned ${provisionedPlants.length} Growatt plant(s).`,
      plants: safePlants,
    });
    return;
  } catch (error: any) {
    console.error("[Growatt Controller Error] Credentials validation failed:", error.message);
    
    const status = error.message?.includes("Invalid Growatt Token") ? 400 : 500;
    res.status(status).json({
      error: error.message || "Failed to validate or synchronize Growatt credentials",
    });
    return;
  }
}

/**
 * Returns all registered Growatt customer records and their latest telemetry generations.
 * GET /api/v1/subadmin/growatt/plants
 */
export async function getGrowattPlants(req: Request, res: Response): Promise<void> {
  try {
    const plants = await prisma.growattCustomer.findMany({
      include: {
        generations: {
          orderBy: { lastUpdated: "desc" },
          take: 1,
        },
      },
      orderBy: { customerName: "asc" },
    });

    // Exclude API tokens before returning data to the frontend
    const safePlants = plants.map(({ apiToken, ...rest }) => ({
      ...rest,
      generation: rest.generations?.[0] || null,
      generations: undefined, // remove raw array
    }));

    res.status(200).json(safePlants);
    return;
  } catch (error: any) {
    console.error("[Growatt Controller Error] Failed to fetch Growatt plants:", error.message);
    res.status(500).json({ error: "Failed to retrieve Growatt solar plants" });
    return;
  }
}

/**
 * Manually triggers a real-time telemetry generation update on-demand.
 * POST /api/v1/subadmin/growatt/sync
 */
export async function manualSyncGrowattPlant(req: Request, res: Response): Promise<void> {
  const { customerId } = req.body;

  if (!customerId) {
    res.status(400).json({ error: "Customer ID is required" });
    return;
  }

  try {
    const id = parseInt(customerId, 10);
    console.log(`[Growatt Controller] Manual sync requested for Customer ID: ${id}`);
    
    const genRecord = await GrowattApiClient.syncGeneration(id);
    
    res.status(200).json({
      success: true,
      message: "Telemetry metrics synchronized successfully.",
      generation: genRecord,
    });
    return;
  } catch (error: any) {
    console.error(`[Growatt Controller Error] Manual sync failed for customer ID ${customerId}:`, error.message);
    
    res.status(500).json({
      error: error.message || "Failed to execute manual telemetry sync.",
    });
    return;
  }
}

/**
 * Deletes a Growatt customer plant record from the database.
 * DELETE /api/v1/subadmin/growatt/plants/:id
 */
export async function deleteGrowattPlant(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: "Plant ID parameter is required" });
    return;
  }

  try {
    const targetId = parseInt(id, 10);
    await prisma.growattCustomer.delete({
      where: { id: targetId },
    });

    console.log(`[Growatt Controller] Deleted Growatt Customer ID: ${targetId}`);
    res.status(200).json({
      success: true,
      message: "Growatt plant monitor deleted successfully.",
    });
    return;
  } catch (error: any) {
    console.error(`[Growatt Controller Error] Failed to delete plant ID ${id}:`, error.message);
    res.status(500).json({ error: "Failed to delete Growatt plant monitor" });
    return;
  }
}
