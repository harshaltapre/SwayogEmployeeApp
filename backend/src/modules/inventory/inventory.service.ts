import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";
import type {
  CreateInventoryInput,
  UpdateInventoryInput,
  CreateDispatchInput,
  UpdateDispatchInput,
} from "./inventory.schemas.js";
import { createAdminNotification } from "../../services/notificationService.js";

// Helper to serialize database models into frontend-compatible structures
function serializeInventoryItem(item: any) {
  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    category: item.category,
    company: item.company ?? "",
    capacityKw: item.capacityKw ?? "",
    unit: item.unit ?? "unit",
    inStock: item.inStock,
    minThreshold: item.minThreshold,
    supplier: item.supplier ?? "",
    isLowStock: item.inStock <= item.minThreshold,
    pricePerUnit: item.pricePerUnit,
    entryDate: item.entryDate.toISOString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function serializeDispatchRecord(record: any) {
  return {
    id: record.id,
    customerId: record.customerId,
    customerName: record.customer?.fullName ?? "Unknown Customer",
    itemId: record.itemId,
    itemName: record.item?.name ?? "Unknown Item",
    quantity: record.quantity,
    pricePerUnit: record.item?.pricePerUnit ?? 0,
    dispatchedAt: record.dispatchedAt.toISOString(),
    notes: record.notes ?? "",
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listInventoryItems(_auth: AuthContext) {
  const items = await prisma.inventory.findMany({
    orderBy: { name: "asc" },
  });
  return items.map(serializeInventoryItem);
}

export async function getInventoryItemById(_auth: AuthContext, id: number) {
  const item = await prisma.inventory.findUnique({
    where: { id },
  });
  if (!item) {
    throw new ApiError(404, "Inventory item not found");
  }
  return serializeInventoryItem(item);
}

export async function createInventoryItem(_auth: AuthContext, input: CreateInventoryInput) {
  const existing = await prisma.inventory.findUnique({
    where: { sku: input.sku },
  });
  if (existing) {
    throw new ApiError(400, `An item with SKU "${input.sku}" already exists`);
  }

  const parsedEntryDate = input.entryDate && !isNaN(new Date(input.entryDate).getTime())
    ? new Date(input.entryDate)
    : new Date();

  const item = await prisma.inventory.create({
    data: {
      sku: input.sku,
      name: input.name,
      category: input.category,
      company: input.company,
      capacityKw: input.capacityKw,
      unit: input.unit ?? "unit",
      inStock: input.inStock ?? 0,
      minThreshold: input.minThreshold ?? 0,
      supplier: input.supplier,
      pricePerUnit: input.pricePerUnit ?? 0,
      entryDate: parsedEntryDate,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: _auth.userId } });
  const userName = user?.fullName || _auth.loginId;
  await createAdminNotification({
    type: "MATERIAL_ADD",
    message: `${userName} added new material: ${item.name} (${item.inStock} ${item.unit || "units"})`,
    employeeId: _auth.userId,
  });

  return serializeInventoryItem(item);
}

export async function updateInventoryItem(_auth: AuthContext, id: number, input: UpdateInventoryInput) {
  const existing = await prisma.inventory.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new ApiError(404, "Inventory item not found");
  }

  if (input.sku && input.sku !== existing.sku) {
    const duplicate = await prisma.inventory.findUnique({
      where: { sku: input.sku },
    });
    if (duplicate) {
      throw new ApiError(400, `An item with SKU "${input.sku}" already exists`);
    }
  }

  const updateData: any = {};
  if (input.sku !== undefined) updateData.sku = input.sku;
  if (input.name !== undefined) updateData.name = input.name;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.inStock !== undefined) updateData.inStock = input.inStock;
  if (input.minThreshold !== undefined) updateData.minThreshold = input.minThreshold;
  if (input.supplier !== undefined) updateData.supplier = input.supplier;
  if (input.pricePerUnit !== undefined) updateData.pricePerUnit = input.pricePerUnit;
  if (input.entryDate !== undefined) {
    updateData.entryDate = input.entryDate && !isNaN(new Date(input.entryDate).getTime())
      ? new Date(input.entryDate)
      : new Date();
  }
  if (input.company !== undefined) updateData.company = input.company;
  if (input.capacityKw !== undefined) updateData.capacityKw = input.capacityKw;
  if (input.unit !== undefined) updateData.unit = input.unit;

  const updated = await prisma.inventory.update({
    where: { id },
    data: updateData,
  });

  const user = await prisma.user.findUnique({ where: { id: _auth.userId } });
  const userName = user?.fullName || _auth.loginId;
  let notificationMessage = `${userName} updated material: ${updated.name}`;
  if (input.inStock !== undefined && input.inStock > existing.inStock) {
    const diff = input.inStock - existing.inStock;
    notificationMessage = `${userName} added ${diff} ${updated.unit || "units"} to ${updated.name} (Total: ${updated.inStock})`;
  }
  await createAdminNotification({
    type: "MATERIAL_ADD",
    message: notificationMessage,
    employeeId: _auth.userId,
  });

  return serializeInventoryItem(updated);
}

export async function deleteInventoryItem(_auth: AuthContext, id: number) {
  const existing = await prisma.inventory.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new ApiError(404, "Inventory item not found");
  }

  await prisma.inventory.delete({
    where: { id },
  });

  return { success: true };
}

// Dispatch records

export async function listDispatchRecords(_auth: AuthContext) {
  const dispatches = await prisma.dispatchRecord.findMany({
    include: {
      customer: { select: { fullName: true } },
      item: { select: { name: true, pricePerUnit: true } },
    },
    orderBy: { dispatchedAt: "desc" },
  });
  return dispatches.map(serializeDispatchRecord);
}

export async function createDispatchRecord(_auth: AuthContext, input: CreateDispatchInput) {
  const customerExists = await prisma.customer.findUnique({
    where: { id: input.customerId },
  });
  if (!customerExists) {
    throw new ApiError(404, "Customer not found");
  }

  const item = await prisma.inventory.findUnique({
    where: { id: input.itemId },
  });
  if (!item) {
    throw new ApiError(404, "Inventory item not found");
  }

  if (item.inStock < input.quantity) {
    throw new ApiError(400, `Insufficient stock for ${item.name}. Available: ${item.inStock}, Requested: ${input.quantity}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Decrement stock
    await tx.inventory.update({
      where: { id: input.itemId },
      data: { inStock: { decrement: input.quantity } },
    });

    // 2. Create dispatch record
    const record = await tx.dispatchRecord.create({
      data: {
        customerId: input.customerId,
        itemId: input.itemId,
        quantity: input.quantity,
        dispatchedAt: input.dispatchedAt ? new Date(input.dispatchedAt) : undefined,
        notes: input.notes,
      },
      include: {
        customer: { select: { fullName: true } },
        item: { select: { name: true, pricePerUnit: true } },
      },
    });

    return record;
  });

  const user = await prisma.user.findUnique({ where: { id: _auth.userId } });
  const userName = user?.fullName || _auth.loginId;
  await createAdminNotification({
    type: "INVENTORY_DISPATCH",
    message: `${userName} dispatched ${result.quantity} units of ${result.item?.name || "item"} to ${result.customer?.fullName || "customer"}`,
    employeeId: _auth.userId,
  });

  return serializeDispatchRecord(result);
}

export async function updateDispatchRecord(_auth: AuthContext, id: string, input: UpdateDispatchInput) {
  const existing = await prisma.dispatchRecord.findUnique({
    where: { id },
    include: { item: true },
  });
  if (!existing) {
    throw new ApiError(404, "Dispatch record not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    if (input.quantity !== undefined && input.quantity !== existing.quantity) {
      const quantityDifference = input.quantity - existing.quantity;

      if (quantityDifference > 0) {
        const currentItem = await tx.inventory.findUnique({
          where: { id: existing.itemId },
        });
        if (!currentItem || currentItem.inStock < quantityDifference) {
          throw new ApiError(400, `Insufficient stock for ${existing.item.name}. Available: ${currentItem?.inStock ?? 0}, Additional requested: ${quantityDifference}`);
        }
      }

      await tx.inventory.update({
        where: { id: existing.itemId },
        data: { inStock: { decrement: quantityDifference } },
      });
    }

    const updatedRecord = await tx.dispatchRecord.update({
      where: { id },
      data: {
        quantity: input.quantity,
        notes: input.notes,
      },
      include: {
        customer: { select: { fullName: true } },
        item: { select: { name: true, pricePerUnit: true } },
      },
    });

    return updatedRecord;
  });

  return serializeDispatchRecord(result);
}

export async function deleteDispatchRecord(_auth: AuthContext, id: string) {
  const existing = await prisma.dispatchRecord.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new ApiError(404, "Dispatch record not found");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Increment back the stock level
    await tx.inventory.update({
      where: { id: existing.itemId },
      data: { inStock: { increment: existing.quantity } },
    });

    // 2. Delete dispatch record
    await tx.dispatchRecord.delete({
      where: { id },
    });
  });

  return { success: true };
}
