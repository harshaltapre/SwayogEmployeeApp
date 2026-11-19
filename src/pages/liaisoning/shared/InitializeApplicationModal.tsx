import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, RefreshCw, CheckCircle2 } from "lucide-react";
import {
  useLiaisoningEligibleCustomers,
  useInitializeLiaisoningApplication,
} from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface InitializeApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InitializeApplicationModal({
  open,
  onOpenChange,
  onSuccess,
}: InitializeApplicationModalProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const { data: eligibleResponse, isLoading, refetch } = useLiaisoningEligibleCustomers(search, {
    enabled: open,
  });
  const customers = Array.isArray(eligibleResponse)
    ? eligibleResponse
    : (eligibleResponse?.data || []);
  const initializeMutation = useInitializeLiaisoningApplication();

  const handleInitialize = async () => {
    if (!selectedCustomerId) return;
    try {
      await initializeMutation.mutateAsync({ customerId: selectedCustomerId });
      toast({
        title: "Application Initialized",
        description: "New solar liaisoning application initialized with all 11 stages.",
      });
      setSelectedCustomerId(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: "Failed to initialize application",
        description: err?.error || err?.message || "An error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <UserPlus className="w-5 h-5 text-amber-600" />
            Initialize Solar Liaisoning Application
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Select a converted marketing lead to start their DISCOM, net metering, and subsidy liaisoning process.
          </p>
        </DialogHeader>

        <div className="py-2 space-y-3 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, mobile, or consumer number..."
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex-1 overflow-y-auto border rounded-lg divide-y divide-slate-100 max-h-[360px]">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                Loading eligible customers...
              </div>
            ) : customers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                {search
                  ? "No customers found matching your search."
                  : "All current customers already have liaisoning applications initialized, or no customers exist."}
              </div>
            ) : (
              customers.map((c: any) => {
                const isSelected = selectedCustomerId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`p-3 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-amber-50/80 border-l-4 border-l-amber-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{c.fullName}</span>
                        {c.systemCapacityKw && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                            {c.systemCapacityKw} kW
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 mt-0.5 flex items-center gap-3">
                        <span className="font-mono">{c.phoneNumber}</span>
                        {c.consumerNumber && <span>Consumer: {c.consumerNumber}</span>}
                        {c.discomName && <span>DISCOM: {c.discomName}</span>}
                      </div>
                      {c.fullAddress && (
                        <div className="text-slate-400 text-[11px] mt-0.5 truncate max-w-md">
                          {c.fullAddress}
                        </div>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2 border-t pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={initializeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            disabled={!selectedCustomerId || initializeMutation.isPending}
            onClick={handleInitialize}
          >
            {initializeMutation.isPending ? "Initializing..." : "Initialize Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

