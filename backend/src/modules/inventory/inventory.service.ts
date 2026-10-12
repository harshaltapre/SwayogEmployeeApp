import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";
import type {
  CreateInventoryInput,
  UpdateInventoryInput,
  RestockInventoryInput,
  CreateDispatchInput,
  UpdateDispatchInput,
} from "./inventory.schemas.js";
import { createAdminNotification } from "../../services/notificationService.js";

function isMissingStockHistoryTable(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

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

  const itemData = {
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
  };
  const user = await prisma.user.findUnique({ where: { id: _auth.userId } });
  const userName = user?.fullName || _auth.loginId;

  let item;
  try {
    item = await prisma.$transaction(async (tx) => {
      const createdItem = await tx.inventory.create({ data: itemData });
      if (createdItem.inStock > 0) {
        await tx.inventoryStockEntry.create({
          data: {
            itemId: createdItem.id,
            quantity: createdItem.inStock,
            previousQuantity: 0,
            newQuantity: createdItem.inStock,
            transactionType: "ADD",
            movementType: "IN",
            entryDate: parsedEntryDate,
            pricePerUnit: createdItem.pricePerUnit,
            supplier: createdItem.supplier,
            notes: "Opening stock",
            remarks: "Opening stock",
            createdBy: userName,
          },
        });
      }
      return createdItem;
    });
  } catch (error) {
    if (!isMissingStockHistoryTable(error)) {
      throw error;
    }
    console.warn("[Inventory] Stock history table is missing; creating the item without an opening-stock history entry.");
    item = await prisma.inventory.create({ data: itemData });
  }

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

  const user = await prisma.user.findUnique({ where: { id: _auth.userId } });
  const userName = user?.fullName || _auth.loginId;

  let updated;
  const stockChanged = input.inStock !== undefined && input.inStock !== existing.inStock;
  if (stockChanged) {
    const difference = input.inStock! - existing.inStock;
    const movementDate = input.entryDate
      ? updateData.entryDate
      : new Date();
    try {
      updated = await prisma.$transaction(async (tx) => {
        const result = await tx.inventory.update({
          where: { id },
          data: updateData,
        });
        await tx.inventoryStockEntry.create({
          data: {
            itemId: id,
            quantity: Math.abs(difference),
            previousQuantity: existing.inStock,
            newQuantity: input.inStock!,
            transactionType: difference > 0 ? "ADD" : "ADJUSTMENT",
            movementType: difference > 0 ? "IN" : "OUT",
            entryDate: movementDate,
            pricePerUnit: input.pricePerUnit ?? existing.pricePerUnit,
            supplier: input.supplier ?? existing.supplier,
            notes: "Manual stock adjustment",
            remarks: "Manual stock adjustment",
            createdBy: userName,
          },
        });
        return result;
      });
    } catch (error) {
      if (!isMissingStockHistoryTable(error)) {
        throw error;
      }
      console.warn("[Inventory] Stock history table is missing; updating stock without an adjustment history entry.");
      updated = await prisma.inventory.update({ where: { id }, data: updateData });
    }
  } else {
    updated = await prisma.inventory.update({
      where: { id },
      data: updateData,
    });
  }

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

export async function restockInventoryItem(_auth: AuthContext, id: number, input: RestockInventoryInput) {
  const parsedEntryDate = new Date(input.entryDate);
  if (Number.isNaN(parsedEntryDate.getTime())) {
    throw new ApiError(400, "Entry date must be a valid date");
  }

  const entryDate = parsedEntryDate;
  const user = await prisma.user.findUnique({ where: { id: _auth.userId } });
  const userName = user?.fullName || _auth.loginId;

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      // 1. Find the existing inventory item
      const item = await tx.inventory.findUnique({ where: { id } });
      if (!item) {
        throw new ApiError(404, "Inventory item not found");
      }

      // 2. Read its current quantity
      const previousQuantity = item.inStock;
      // 3. Read the new quantity entered by the user
      // 7. Calculate the new quantity
      const newQuantity = previousQuantity + input.quantity;

      // 8. Update the master item's current quantity without overwriting original entryDate
      const updatedItem = await tx.inventory.update({
        where: { id },
        data: {
          inStock: newQuantity,
          pricePerUnit: input.pricePerUnit,
          supplier: input.supplier,
        },
      });

      // 4. Create a new inventory history record
      // 5. Store the date entered by the user in that transaction
      // 6. Store the previous quantity
      // 9. Keep all previous history records unchanged
      await tx.inventoryStockEntry.create({
        data: {
          itemId: id,
          quantity: input.quantity,
          previousQuantity,
          newQuantity,
          transactionType: "ADD",
          movementType: "IN",
          entryDate,
          pricePerUnit: input.pricePerUnit,
          supplier: input.supplier,
          notes: (input as any).remarks || (input as any).notes || "Stock added",
          remarks: (input as any).remarks || (input as any).notes || "Stock added",
          createdBy: userName,
        },
      });
      return updatedItem;
    });
  } catch (error) {
    if (isMissingStockHistoryTable(error)) {
      console.warn(
        "[Inventory] Stock history table is missing; adding stock to the existing item without a history entry. Deploy pending database migrations.",
      );
      const item = await prisma.inventory.findUnique({ where: { id } });
      if (!item) {
        throw new ApiError(404, "Inventory item not found");
      }
      const updatedItem = await prisma.inventory.update({
        where: { id },
        data: {
          inStock: item.inStock + input.quantity,
          pricePerUnit: input.pricePerUnit,
          supplier: input.supplier,
        },
      });
      updated = updatedItem;
    } else {
      throw error;
    }
  }

  await createAdminNotification({
    type: "MATERIAL_ADD",
    message: `${userName} added ${input.quantity} ${updated.unit || "units"} to ${updated.name} (Total: ${updated.inStock})`,
    employeeId: _auth.userId,
  });

  return serializeInventoryItem(updated);
}

export async function listInventoryStockEntries(_auth: AuthContext, id: number) {
  const item = await prisma.inventory.findUnique({
    where: { id },
  });
  if (!item) {
    throw new ApiError(404, "Inventory item not found");
  }

  try {
    const entries = await prisma.inventoryStockEntry.findMany({
      where: { itemId: id },
      orderBy: [{ entryDate: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    });

    let runningBalance = 0;
    const mapped = entries.map((entry) => {
      let prev = entry.previousQuantity;
      let next = entry.newQuantity;

      let tType = entry.transactionType || "ADD";
      if (!entry.transactionType) {
        if (entry.movementType === "OUT") tType = "REMOVE";
        else if (entry.movementType === "RETURN") tType = "RETURN";
        else tType = "ADD";
      }

      if (prev === 0 && next === 0) {
        prev = runningBalance;
        if (tType === "ADD" || tType === "RETURN") {
          next = runningBalance + entry.quantity;
        } else if (tType === "REMOVE") {
          next = Math.max(0, runningBalance - entry.quantity);
        } else {
          next = runningBalance + entry.quantity;
        }
      }
      runningBalance = next;

      return {
        id: entry.id,
        itemId: entry.itemId,
        inventoryItemId: entry.itemId,
        transactionType: tType,
        movementType: entry.movementType,
        quantity: entry.quantity,
        previousQuantity: prev,
        newQuantity: next,
        balance: next,
        entryDate: entry.entryDate.toISOString(),
        transactionDate: entry.entryDate.toISOString(),
        pricePerUnit: entry.pricePerUnit,
        supplier: entry.supplier,
        dispatchedTo: entry.dispatchedTo,
        notes: entry.notes || entry.remarks || null,
        remarks: entry.remarks || entry.notes || null,
        createdBy: entry.createdBy || null,
        createdAt: entry.createdAt.toISOString(),
      };
    });

    return {
      item: serializeInventoryItem(item),
      entries: mapped,
      historyAvailable: true,
    };
  } catch (error) {
    if (isMissingStockHistoryTable(error)) {
      console.warn(
        "[Inventory] Stock history table is missing; returning an empty history. Deploy pending database migrations.",
      );
      return { item: serializeInventoryItem(item), entries: [], historyAvailable: false };
    }
    throw error;
  }
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

  const user = await prisma.user.findUnique({ where: { id: _auth.userId } });
  const userName = user?.fullName || _auth.loginId;

  const createDispatch = (recordMovement: boolean) => prisma.$transaction(async (tx) => {
    const previousQuantity = item.inStock;
    const newQuantity = previousQuantity - input.quantity;

    await tx.inventory.update({
      where: { id: input.itemId },
      data: { inStock: { decrement: input.quantity } },
    });

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

    if (recordMovement) {
      await tx.inventoryStockEntry.create({
        data: {
          itemId: input.itemId,
          quantity: input.quantity,
          previousQuantity,
          newQuantity,
          transactionType: "REMOVE",
          movementType: "OUT",
          entryDate: record.dispatchedAt,
          pricePerUnit: item.pricePerUnit,
          dispatchedTo: customerExists.fullName,
          notes: input.notes,
          remarks: input.notes || `Dispatched to ${customerExists.fullName}`,
          createdBy: userName,
        },
      });
    }

    return record;
  });
  let result;
  try {
    result = await createDispatch(true);
  } catch (error) {
    if (!isMissingStockHistoryTable(error)) {
      throw error;
    }
    console.warn("[Inventory] Stock history table is missing; dispatch will update stock without a movement entry.");
    result = await createDispatch(false);
  }

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
    include: { item: true, customer: { select: { fullName: true } } },
  });
  if (!existing) {
    throw new ApiError(404, "Dispatch record not found");
  }

  const user = await prisma.user.findUnique({ where: { id: _auth.userId } });
  const userName = user?.fullName || _auth.loginId;

  const updateDispatch = (recordMovement: boolean) => prisma.$transaction(async (tx) => {
    if (input.quantity !== undefined && input.quantity !== existing.quantity) {
      const quantityDifference = input.quantity - existing.quantity;

      const currentItem = await tx.inventory.findUnique({
        where: { id: existing.itemId },
      });
      if (quantityDifference > 0) {
        if (!currentItem || currentItem.inStock < quantityDifference) {
          throw new ApiError(400, `Insufficient stock for ${existing.item.name}. Available: ${currentItem?.inStock ?? 0}, Additional requested: ${quantityDifference}`);
        }
      }

      await tx.inventory.update({
        where: { id: existing.itemId },
        data: { inStock: { decrement: quantityDifference } },
      });

      if (recordMovement) {
        const previousQuantity = currentItem?.inStock ?? existing.item.inStock;
        const newQuantity = previousQuantity - quantityDifference;
        await tx.inventoryStockEntry.create({
          data: {
            itemId: existing.itemId,
            quantity: Math.abs(quantityDifference),
            previousQuantity,
            newQuantity,
            transactionType: quantityDifference > 0 ? "REMOVE" : "RETURN",
            movementType: quantityDifference > 0 ? "OUT" : "RETURN",
            entryDate: new Date(),
            pricePerUnit: existing.item.pricePerUnit,
            dispatchedTo: existing.customer.fullName,
            notes: quantityDifference > 0
              ? "Additional quantity on dispatch"
              : "Dispatch quantity adjustment",
            remarks: quantityDifference > 0
              ? "Additional quantity on dispatch"
              : "Dispatch quantity adjustment",
            createdBy: userName,
          },
        });
      }
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

  let result;
  try {
    result = await updateDispatch(true);
  } catch (error) {
    if (!isMissingStockHistoryTable(error)) {
      throw error;
    }
    console.warn("[Inventory] Stock history table is missing; dispatch update will not be recorded in movement history.");
    result = await updateDispatch(false);
  }

  return serializeDispatchRecord(result);
}

export async function deleteDispatchRecord(_auth: AuthContext, id: string) {
  const existing = await prisma.dispatchRecord.findUnique({
    where: { id },
    include: {
      item: true,
      customer: { select: { fullName: true } },
    },
  });
  if (!existing) {
    throw new ApiError(404, "Dispatch record not found");
  }

  const user = await prisma.user.findUnique({ where: { id: _auth.userId } });
  const userName = user?.fullName || _auth.loginId;

  const deleteDispatch = (recordMovement: boolean) => prisma.$transaction(async (tx) => {
    // 1. Increment back the stock level
    await tx.inventory.update({
      where: { id: existing.itemId },
      data: { inStock: { increment: existing.quantity } },
    });

    if (recordMovement) {
      const previousQuantity = existing.item.inStock;
      const newQuantity = previousQuantity + existing.quantity;
      await tx.inventoryStockEntry.create({
        data: {
          itemId: existing.itemId,
          quantity: existing.quantity,
          previousQuantity,
          newQuantity,
          transactionType: "RETURN",
          movementType: "RETURN",
          entryDate: new Date(),
          pricePerUnit: existing.item.pricePerUnit,
          dispatchedTo: existing.customer.fullName,
          notes: "Dispatch cancelled",
          remarks: "Dispatch cancelled",
          createdBy: userName,
        },
      });
    }

    // 2. Delete dispatch record
    await tx.dispatchRecord.delete({
      where: { id },
    });
  });
  try {
    await deleteDispatch(true);
  } catch (error) {
    if (!isMissingStockHistoryTable(error)) {
      throw error;
    }
    console.warn("[Inventory] Stock history table is missing; dispatch cancellation will not be recorded in movement history.");
    await deleteDispatch(false);
  }

  return { success: true };
}
