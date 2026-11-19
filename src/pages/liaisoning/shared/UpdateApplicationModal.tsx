import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateLiaisoningApplication } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { LIAISONING_STAGES } from "./types";

interface UpdateApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any;
  onSuccess?: () => void;
}

export function UpdateApplicationModal({
  open,
  onOpenChange,
  application,
  onSuccess,
}: UpdateApplicationModalProps) {
  const { toast } = useToast();
  const updateMutation = useUpdateLiaisoningApplication();

  const [form, setForm] = useState({
    applicationNumber: "",
    discomName: "",
    currentStage: "CUSTOMER_REGISTRATION",
    overallStatus: "NOT_STARTED",
    applicationSubmissionDate: "",
    nextFollowUpDate: "",
    followUpRemarks: "",
  });

  useEffect(() => {
    if (application) {
      setForm({
        applicationNumber: application.applicationNumber || "",
        discomName: application.discomName || "",
        currentStage: application.currentStage || "CUSTOMER_REGISTRATION",
        overallStatus: application.overallStatus || "NOT_STARTED",
        applicationSubmissionDate: application.applicationSubmissionDate
          ? new Date(application.applicationSubmissionDate).toISOString().slice(0, 10)
          : "",
        nextFollowUpDate: application.nextFollowUpDate
          ? new Date(application.nextFollowUpDate).toISOString().slice(0, 10)
          : "",
        followUpRemarks: application.followUpRemarks || "",
      });
    }
  }, [application]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application?.id) return;

    try {
      await updateMutation.mutateAsync({
        id: application.id,
        data: {
          applicationNumber: form.applicationNumber.trim() || undefined,
          discomName: form.discomName || undefined,
          currentStage: form.currentStage || undefined,
          overallStatus: form.overallStatus || undefined,
          applicationSubmissionDate: form.applicationSubmissionDate
            ? new Date(form.applicationSubmissionDate)
            : undefined,
          nextFollowUpDate: form.nextFollowUpDate
            ? new Date(form.nextFollowUpDate)
            : undefined,
          followUpRemarks: form.followUpRemarks.trim() || undefined,
        },
      });

      toast({
        title: "Application Updated",
        description: "Application details and pipeline stage saved successfully.",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err?.error || err?.message || "Failed to update application.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Edit Application Details & Stage
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Customer: {application?.customer?.fullName} ({application?.customer?.phoneNumber})
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Pipeline Stage (11 Stages)</Label>
              <Select
                value={form.currentStage}
                onValueChange={(val) => setForm({ ...form, currentStage: val })}
              >
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue placeholder="Select Stage" />
                </SelectTrigger>
                <SelectContent>
                  {LIAISONING_STAGES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      Step {s.step}. {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Overall Status</Label>
              <Select
                value={form.overallStatus}
                onValueChange={(val) => setForm({ ...form, overallStatus: val })}
              >
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
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
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">Application Number / Consumer ID</Label>
            <Input
              value={form.applicationNumber}
              onChange={(e) => setForm({ ...form, applicationNumber: e.target.value })}
              placeholder="e.g., MSEDCL-SOL-2026-9812"
              className="mt-1 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">DISCOM Provider</Label>
            <Select
              value={form.discomName}
              onValueChange={(val) => setForm({ ...form, discomName: val })}
            >
              <SelectTrigger className="mt-1 text-xs">
                <SelectValue placeholder="Select DISCOM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MSEDCL">MSEDCL (Maharashtra State Electricity)</SelectItem>
                <SelectItem value="MAHADISCOM">MAHADISCOM</SelectItem>
                <SelectItem value="Torrent Power">Torrent Power</SelectItem>
                <SelectItem value="Tata Power">Tata Power</SelectItem>
                <SelectItem value="Adani Electricity">Adani Electricity</SelectItem>
                <SelectItem value="Other DISCOMs">Other DISCOMs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Portal Submission Date</Label>
              <Input
                type="date"
                value={form.applicationSubmissionDate}
                onChange={(e) => setForm({ ...form, applicationSubmissionDate: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700">Next Follow-up Date</Label>
              <Input
                type="date"
                value={form.nextFollowUpDate}
                onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">Follow-up Remarks</Label>
            <Textarea
              value={form.followUpRemarks}
              onChange={(e) => setForm({ ...form, followUpRemarks: e.target.value })}
              placeholder="Enter current follow-up notes..."
              rows={3}
              className="mt-1 text-xs"
            />
          </div>

          <DialogFooter className="mt-4 gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
