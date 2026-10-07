import { useEffect, useState, type FormEvent } from "react";
import { Loader2, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InventoryRecord, RestockInventoryInput } from "@/lib/api-client";

interface AddInventoryStockDialogProps {
  item: InventoryRecord | null;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: RestockInventoryInput) => Promise<void>;
}

function getTodayDate() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "error" in error && typeof error.error === "string") {
    return error.error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unable to add stock. Please try again.";
}

export default function AddInventoryStockDialog({
  item,
  isLoading,
  onClose,
  onSubmit,
}: AddInventoryStockDialogProps) {
  const [quantity, setQuantity] = useState("1");
  const [entryDate, setEntryDate] = useState(getTodayDate);
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [supplier, setSupplier] = useState("");
  const [error, setError] = useState("");
  const selectedItemId = item?.id;
  const selectedPrice = item?.pricePerUnit;

  useEffect(() => {
    if (selectedItemId !== undefined) {
      setQuantity("1");
      setEntryDate(getTodayDate());
      setPricePerUnit(String(selectedPrice ?? 0));
      setSupplier(item?.supplier ?? "");
      setError("");
    }
  }, [item?.supplier, selectedItemId, selectedPrice]);

  const currentStock = Number(item?.inStock ?? 0);
  const addQuantity = Number(quantity);
  const nextStock = currentStock + (Number.isSafeInteger(addQuantity) && addQuantity > 0 ? addQuantity : 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item) return;

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(pricePerUnit);
    const parsedSupplier = supplier.trim();
    if (!Number.isSafeInteger(parsedQuantity) || parsedQuantity < 1) {
      setError("Quantity must be a whole number greater than zero.");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Enter a valid unit price.");
      return;
    }
    if (!entryDate) {
      setError("Select the purchase date.");
      return;
    }
    if (!parsedSupplier) {
      setError("Enter the supplier name.");
      return;
    }

    setError("");
    try {
      await onSubmit({
        quantity: parsedQuantity,
        entryDate,
        pricePerUnit: parsedPrice,
        supplier: parsedSupplier,
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  }

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            Add Item to Stock
          </DialogTitle>
          <DialogDescription>
            Record another purchase under this item&apos;s SKU. Each purchase keeps its own date, price, supplier, and quantity while increasing the total stock.
          </DialogDescription>
        </DialogHeader>

        {item && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restock-item-name">Existing item</Label>
              <Input id="restock-item-name" value={`${item.name} (${item.sku})`} readOnly />
              <p className="text-sm text-muted-foreground">
                Current stock: {item.inStock} {item.unit || "units"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="restock-quantity">Quantity to add *</Label>
              <Input
                id="restock-quantity"
                type="number"
                min="1"
                step="1"
                required
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                New stock total: {nextStock} {item.unit || "units"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="restock-price">Price per unit (₹) *</Label>
              <Input
                id="restock-price"
                type="number"
                min="0"
                step="0.01"
                required
                value={pricePerUnit}
                onChange={(event) => setPricePerUnit(event.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restock-entry-date">Purchase date *</Label>
              <Input
                id="restock-entry-date"
                type="date"
                required
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restock-supplier">Supplier name *</Label>
              <Input
                id="restock-supplier"
                type="text"
                required
                value={supplier}
                onChange={(event) => setSupplier(event.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackagePlus className="mr-2 h-4 w-4" />}
                Add Item
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
