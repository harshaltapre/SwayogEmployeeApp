import { format } from "date-fns";
import {
  AlertCircle,
  History,
  Loader2,
  Package,
  User as UserIcon,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { useListInventoryStockEntries, type InventoryRecord } from "@/lib/api-client";

interface InventoryStockEntriesDialogProps {
  item: InventoryRecord | null;
  onClose: () => void;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : format(d, "dd MMM yyyy");
  } catch {
    return String(dateStr);
  }
}

function renderTransactionBadge(type: string | undefined, movementType?: string) {
  const normType = (
    type ||
    (movementType === "OUT" ? "REMOVE" : movementType === "RETURN" ? "RETURN" : "ADD")
  ).toUpperCase();

  switch (normType) {
    case "ADD":
    case "ADDED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
          ADD
        </span>
      );
    case "REMOVE":
    case "REMOVED":
    case "OUT":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
          REMOVE
        </span>
      );
    case "ADJUSTMENT":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
          ADJUSTMENT
        </span>
      );
    case "RETURN":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
          RETURN
        </span>
      );
    case "TRANSFER":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
          TRANSFER
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800">
          {normType}
        </span>
      );
  }
}

export default function InventoryStockEntriesDialog({
  item,
  onClose,
}: InventoryStockEntriesDialogProps) {
  const { data, isLoading, isError } = useListInventoryStockEntries(item?.id ?? null);
  const rawEntries = data?.entries ?? [];

  // Sort chronologically ascending (earliest to latest) to build the complete history timeline
  const entries = [...rawEntries].sort((a, b) => {
    const dateA = a.transactionDate || a.entryDate || a.createdAt;
    const dateB = b.transactionDate || b.entryDate || b.createdAt;
    return String(dateA).localeCompare(String(dateB));
  });

  const unit = item?.unit || "unit";
  const currentStock = item?.inStock ?? 0;

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <History className="h-5 w-5 text-emerald-600" />
                Inventory History — {item?.name ?? "Item"}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                Complete audit trail of all inventory additions, dispatches, adjustments, and movements.
              </DialogDescription>
            </div>
          </div>

          {item && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg bg-slate-50 p-3 text-xs border border-slate-200">
              <div>
                <span className="text-slate-500 font-medium block">Item Name</span>
                <span className="font-bold text-slate-900 truncate block">{item.name}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">SKU</span>
                <span className="font-bold text-slate-800 font-mono block">{item.sku}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Category</span>
                <span className="font-semibold text-slate-700 block">{item.category}</span>
              </div>
              <div className="rounded bg-emerald-50 px-2 py-1 border border-emerald-200">
                <span className="text-emerald-700 font-medium block text-[11px]">Current Stock</span>
                <span className="font-extrabold text-emerald-900 text-sm block">
                  {currentStock} {unit}
                </span>
              </div>
            </div>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span>Loading inventory history records...</span>
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>Could not load inventory history. Please try again later.</span>
          </div>
        ) : data && !data.historyAvailable ? (
          <div
            role="status"
            className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800"
          >
            Stock history is unavailable because the database migration is pending. Deploy the backend and apply its Prisma migrations to view complete history.
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 overflow-hidden shadow-xs">
              <Table>
                <TableHeader className="bg-slate-100/80">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 text-xs py-3">DATE</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3">TYPE</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3 text-right">QTY</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3 text-center">PREVIOUS</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3 text-center">NEW / BALANCE</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3">PERFORMED BY</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3">REMARKS / DETAILS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => {
                    const normType = (
                      entry.transactionType ||
                      (entry.movementType === "OUT" ? "REMOVE" : entry.movementType === "RETURN" ? "RETURN" : "ADD")
                    ).toUpperCase();
                    const isRemove = normType === "REMOVE" || normType === "OUT";
                    const prev = entry.previousQuantity ?? 0;
                    const next = entry.newQuantity ?? (entry.balance ?? 0);
                    const qtySign = isRemove ? "−" : "+";

                    return (
                      <TableRow key={entry.id || index} className="hover:bg-slate-50/80">
                        <TableCell className="font-medium text-slate-800 text-xs whitespace-nowrap">
                          {formatDate(entry.transactionDate || entry.entryDate)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {renderTransactionBadge(entry.transactionType, entry.movementType)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold text-xs whitespace-nowrap ${
                            isRemove ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          {qtySign}
                          {entry.quantity} {unit}
                        </TableCell>
                        <TableCell className="text-center text-xs text-slate-600 whitespace-nowrap font-mono">
                          {prev} {unit}
                        </TableCell>
                        <TableCell className="text-center font-bold text-xs text-slate-900 whitespace-nowrap font-mono bg-slate-50/60">
                          <span className="inline-flex items-center gap-1 font-extrabold text-slate-900">
                            {next} {unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                            <UserIcon className="h-3 w-3 text-slate-400" />
                            {entry.createdBy || "Admin"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 max-w-[200px] truncate" title={entry.remarks || entry.notes || entry.supplier || entry.dispatchedTo || "—"}>
                          {entry.remarks || entry.notes || (entry.supplier ? `Supplier: ${entry.supplier}` : entry.dispatchedTo ? `To: ${entry.dispatchedTo}` : "—")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Bottom summary bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <Layers className="h-4 w-4 text-emerald-600" />
                <span>Total Transactions: <strong>{entries.length}</strong></span>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-700 font-medium mr-2">Current Stock:</span>
                <span className="text-base font-extrabold text-emerald-950 font-mono">
                  {currentStock} {unit}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-slate-500">
            <Package className="h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-700">No inventory history recorded yet</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Transactions will appear here automatically when this item is created, restocked, or dispatched.
            </p>
          </div>
        )}

        <DialogFooter className="border-t pt-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
