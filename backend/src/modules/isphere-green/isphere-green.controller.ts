import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

export const getIsphereGreenEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, subcategory, search } = req.query;

    const where: any = {};
    if (category && typeof category === "string") {
      where.category = category;
    }
    if (subcategory && typeof subcategory === "string") {
      where.subcategory = subcategory;
    }
    if (search && typeof search === "string" && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { place: { contains: searchTerm, mode: "insensitive" } },
        { phone: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const entries = await (prisma as any).isphereGreenEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (error: any) {
    console.error("Error fetching Isphere Green entries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Isphere Green entries",
      error: error.message,
    });
  }
};

export const getIsphereGreenEntryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const entry = await (prisma as any).isphereGreenEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      res.status(404).json({
        success: false,
        message: "Isphere Green entry not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error: any) {
    console.error("Error fetching Isphere Green entry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Isphere Green entry",
      error: error.message,
    });
  }
};

export const createIsphereGreenEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, subcategory, name, place, phone, email, address, details, status } = req.body;

    if (!category || !subcategory || !name || !place) {
      res.status(400).json({
        success: false,
        message: "category, subcategory, name, and place are required fields",
      });
      return;
    }

    const newEntry = await (prisma as any).isphereGreenEntry.create({
      data: {
        category,
        subcategory,
        name: name.trim(),
        place: place.trim(),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        details: details || {},
        status: status || "ACTIVE",
      },
    });

    res.status(201).json({
      success: true,
      message: "Isphere Green entry created successfully",
      data: newEntry,
    });
  } catch (error: any) {
    console.error("Error creating Isphere Green entry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create Isphere Green entry",
      error: error.message,
    });
  }
};

export const updateIsphereGreenEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { category, subcategory, name, place, phone, email, address, details, status } = req.body;

    const existing = await (prisma as any).isphereGreenEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: "Isphere Green entry not found",
      });
      return;
    }

    const updatedEntry = await (prisma as any).isphereGreenEntry.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(subcategory && { subcategory }),
        ...(name && { name: name.trim() }),
        ...(place && { place: place.trim() }),
        ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
        ...(email !== undefined && { email: email ? email.trim() : null }),
        ...(address !== undefined && { address: address ? address.trim() : null }),
        ...(details !== undefined && { details }),
        ...(status && { status }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Isphere Green entry updated successfully",
      data: updatedEntry,
    });
  } catch (error: any) {
    console.error("Error updating Isphere Green entry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update Isphere Green entry",
      error: error.message,
    });
  }
};

export const deleteIsphereGreenEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await (prisma as any).isphereGreenEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: "Isphere Green entry not found",
      });
      return;
    }

    await (prisma as any).isphereGreenEntry.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Isphere Green entry deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting Isphere Green entry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete Isphere Green entry",
      error: error.message,
    });
  }
};
