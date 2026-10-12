import { format } from "date-fns";
import { AlertCircle, Loader2, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListInventoryStockEntries, type InventoryRecord } from "@/lib/api-client";

interface InventoryStockEntriesDialogProps {
  item: InventoryRecord | null;
  onClose: () => void;
}

export default function InventoryStockEntriesDialog({
  item,
  onClose,
}: InventoryStockEntriesDialogProps) {
  const { data: entries, isLoading, isError } = useListInventoryStockEntries(item?.id ?? null);

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock entries
          </DialogTitle>
          <DialogDescription>
            {item
              ? `${item.name} · SKU ${item.sku} · Current stock ${item.inStock} ${item.unit || "units"}`
              : "Purchase entries for this item."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading stock entries...
          </div>
        ) : isError ? (
          <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Could not load stock entries. Please close this window and try again.
          </div>
        ) : entries?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase date</TableHead>
                <TableHead>Quantity added</TableHead>
                <TableHead>Price per unit</TableHead>
                <TableHead>Supplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.entryDate), "dd MMM yyyy")}</TableCell>
                  <TableCell>{entry.quantity} {item?.unit || "units"}</TableCell>
                  <TableCell>₹{entry.pricePerUnit.toLocaleString("en-IN")}</TableCell>
                  <TableCell>{entry.supplier}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No stock entries are recorded for this SKU yet.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
