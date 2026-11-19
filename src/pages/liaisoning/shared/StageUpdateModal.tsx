import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStageLabel, LIAISONING_STAGES } from "./types";
import { useUpdateLiaisoningStageStatus } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface StageUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  stageKey: string;
  currentStatus: string;
  currentRemarks?: string | null;
  onSuccess?: () => void;
}

export function StageUpdateModal({
  open,
  onOpenChange,
  applicationId,
  stageKey,
  currentStatus,
  currentRemarks,
  onSuccess,
}: StageUpdateModalProps) {
  const { toast } = useToast();
  const updateStageMutation = useUpdateLiaisoningStageStatus();

  const [selectedStage, setSelectedStage] = useState(stageKey || "CUSTOMER_REGISTRATION");
  const [status, setStatus] = useState(currentStatus || "IN_PROGRESS");
  const [remarks, setRemarks] = useState(currentRemarks || "");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedStage(stageKey || "CUSTOMER_REGISTRATION");
      setStatus(currentStatus || "IN_PROGRESS");
      setRemarks(currentRemarks || "");
      setRejectionReason("");
    }
  }, [open, stageKey, currentStatus, currentRemarks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId || !selectedStage) return;

    try {
      await updateStageMutation.mutateAsync({
        applicationId,
        stage: selectedStage,
        status,
        remarks: remarks.trim() || undefined,
        rejectionReason: status === "REJECTED" ? rejectionReason.trim() : undefined,
      });

      toast({
        title: "Stage Updated",
        description: `${getStageLabel(selectedStage)} has been updated to ${status}.`,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: "Failed to update stage",
        description: err?.error || err?.message || "An error occurred while updating the stage.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md z-[100]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Update Liaisoning Stage
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Stage Selection Dropdown */}
          <div>
            <Label className="text-xs font-semibold text-slate-700">Select Pipeline Stage (from 11 Stages) *</Label>
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Stage" />
              </SelectTrigger>
              <SelectContent className="z-[110]">
                {LIAISONING_STAGES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    Step {s.step}. {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stage Status */}
          <div>
            <Label className="text-xs font-semibold text-slate-700">Stage Status *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="z-[110]">
                <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "REJECTED" && (
            <div>
              <Label className="text-xs font-semibold text-rose-700">Rejection Reason *</Label>
              <Textarea
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify exact reason for rejection..."
                rows={3}
                className="mt-1 border-rose-300 focus:border-rose-500"
              />
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold text-slate-700">Process Remarks / Notes</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g., Feasibility documents verified, waiting for site survey inspection..."
              rows={3}
              className="mt-1"
            />
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={updateStageMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              disabled={updateStageMutation.isPending || (status === "REJECTED" && !rejectionReason.trim())}
            >
              {updateStageMutation.isPending ? "Updating..." : "Save Stage Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
