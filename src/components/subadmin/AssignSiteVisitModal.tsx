import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getListTasksQueryKey, useCreateTaskAssignment } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Calendar, User, Phone, Zap, FileText, Loader2, Compass } from "lucide-react";
import { format } from "date-fns";

interface AssignSiteVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Array<{
    id: number;
    userId?: string;
    name: string;
    role?: string;
    email?: string;
    zone?: string;
  }>;
  onSuccess?: () => void;
}

export const AssignSiteVisitModal: React.FC<AssignSiteVisitModalProps> = ({
  isOpen,
  onClose,
  employees = [],
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const assignTaskMutation = useCreateTaskAssignment();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [siteAddress, setSiteAddress] = useState<string>("");
  const [capacity, setCapacity] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [siteInfo, setSiteInfo] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedEmployeeId) {
      toast({
        title: "Employee Required",
        description: "Please select an employee to assign the site visit.",
        variant: "destructive",
      });
      return;
    }

    if (!siteAddress.trim()) {
      toast({
        title: "Site Address Required",
        description: "Please enter the site visit address.",
        variant: "destructive",
      });
      return;
    }

    if (!capacity.trim()) {
      toast({
        title: "Site Capacity Required",
        description: "Please specify the site system capacity.",
        variant: "destructive",
      });
      return;
    }

    const selectedEmp = employees.find(
      (emp) =>
        String(emp.userId || "") === selectedEmployeeId ||
        String(emp.id) === selectedEmployeeId ||
        String(emp.email || "") === selectedEmployeeId
    );

    const targetUserId = String(
      selectedEmp?.userId || (selectedEmp?.id !== undefined ? String(selectedEmp.id) : selectedEmployeeId)
    );

    const formattedDescription = `Site Capacity: ${capacity.trim()}${
      siteInfo.trim() ? `\nSite Info & Notes: ${siteInfo.trim()}` : ""
    }`;

    assignTaskMutation.mutate(
      {
        data: {
          employeeUserId: targetUserId,
          jobType: "Site Visit",
          customerName: customerName.trim() || "Site Visit Customer",
          customerPhone: customerPhone.trim().length >= 8 ? customerPhone.trim() : "9876543210",
          address: siteAddress.trim(),
          description: formattedDescription,
          scheduledTime: new Date(scheduledDateTime).toISOString(),
        },
      },
      {
        onSuccess: (createdTask: any) => {
          toast({
            title: "Site Visit Assigned 📍",
            description: `Site Visit Task successfully assigned to ${selectedEmp?.name || "Employee"}.`,
          });

          const normalizedTask = {
            ...createdTask,
            status: String(createdTask?.status ?? "assigned").toLowerCase(),
            scheduledTime: createdTask?.scheduledTime ?? new Date(scheduledDateTime).toISOString(),
            employeeUserId: createdTask?.employeeUserId ?? targetUserId,
            assignedEmployees: Array.isArray(createdTask?.assignedEmployees)
              ? createdTask.assignedEmployees
              : [{ userId: targetUserId, name: selectedEmp?.name ?? "Employee" }],
            taskAssignments: Array.isArray(createdTask?.taskAssignments)
              ? createdTask.taskAssignments
              : [{ employeeUserId: targetUserId, status: "assigned" }],
          };

          queryClient.setQueriesData({ queryKey: ["tasks"] }, (prev: any) => {
            if (!Array.isArray(prev)) return [normalizedTask];
            const alreadyExists = prev.some((task: any) => String(task.id) === String(normalizedTask.id));
            return alreadyExists ? prev : [normalizedTask, ...prev];
          });
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["employees"] });
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ employeeUserId: targetUserId }) });
          if (onSuccess) onSuccess();
          handleResetAndClose();
        },
        onError: (err: any) => {
          console.error("Site Visit Assignment Error:", err);
          toast({
            title: "Assignment Failed",
            description: err?.message || "Failed to create site visit task. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const resetForm = () => {
    setSelectedEmployeeId("");
    setSiteAddress("");
    setCapacity("");
    setCustomerName("");
    setCustomerPhone("");
    setScheduledDateTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setSiteInfo("");
  };

  const handleResetAndClose = () => {
    resetForm();
    onClose();
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-700">
            <Compass className="h-6 w-6 text-emerald-600" />
            Assign Site Visit Task
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Schedule a site visit for an employee. Upon submission, this will be sent directly to the selected employee as a Site Visit task.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Select Employee */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <User className="h-4 w-4 text-emerald-600" />
              Select Employee <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Choose staff member to assign --" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => {
                  const empValue = String(emp.userId || emp.id);
                  return (
                    <SelectItem key={emp.id} value={empValue}>
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="font-medium">{emp.name}</span>
                        {emp.role && (
                          <span className="text-[11px] text-muted-foreground capitalize">
                            ({emp.role.replace(/_/g, " ")}) {emp.zone ? `- ${emp.zone}` : ""}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Site Capacity & Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" />
                Site Capacity <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. 10 kW Rooftop / 500 kWp"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-500" />
                Scheduled Date & Time <span className="text-red-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-red-500" />
              Site Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Enter full site visit address, landmark, city, pin code..."
              rows={2}
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              required
            />
          </div>

          {/* Customer / Site Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-500" />
                Customer / Contact Person
              </Label>
              <Input
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-slate-500" />
                Contact Phone
              </Label>
              <Input
                placeholder="+91 9876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Site Info & Instructions */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-emerald-600" />
              Required Info & Site Instructions
            </Label>
            <Textarea
              placeholder="Enter required site info, survey requirements, roof feasibility checklist, equipment needed, or special instructions..."
              rows={3}
              value={siteInfo}
              onChange={(e) => setSiteInfo(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetAndClose}
              disabled={assignTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={assignTaskMutation.isPending}
            >
              {assignTaskMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning Task...
                </>
              ) : (
                "Assign Site Visit Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
