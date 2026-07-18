import { useState, useEffect, useRef } from "react";
import { useListEmployees, useListCustomers, useCreateBulkTaskAssignment } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, Check, User, MapPin, Phone, Building, Calendar, ClipboardCheck } from "lucide-react";

interface BulkTaskAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JOB_TYPES = ["Installation", "Service", "AMC Visit", "Complaint", "Survey"];

export function BulkTaskAssignModal({ open, onOpenChange }: BulkTaskAssignModalProps) {
  const { toast } = useToast();
  const { data: employees, isLoading: employeesLoading } = useListEmployees({ limit: 200 });
  const { data: customers, isLoading: customersLoading } = useListCustomers({ limit: 200 });
  const assignBulkTasksMutation = useCreateBulkTaskAssignment();

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; phone: string; address: string } | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeZoneFilter, setEmployeeZoneFilter] = useState("all");

  const [jobType, setJobType] = useState(JOB_TYPES[0]);
  const [description, setDescription] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [taskRate, setTaskRate] = useState("");

  // Filtered lists
  const filteredCustomers = customers?.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.city.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  ).slice(0, 10); // Limit dropdown results to 10 for performance

  const filteredEmployees = employees?.filter((emp) => {
    if (emp.status !== "active") return false;
    const matchesSearch = emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.zone.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (emp.loginId && emp.loginId.toLowerCase().includes(employeeSearch.toLowerCase()));
    const matchesZone = employeeZoneFilter === "all" || emp.zone === employeeZoneFilter;
    return matchesSearch && matchesZone;
  });

  const uniqueZones = Array.from(new Set(employees?.filter(e => e.status === "active").map(e => e.zone) ?? []));

  const handleSelectCustomer = (customer: typeof customers[number]) => {
    setSelectedCustomer({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
    });
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  };

  const handleEmployeeToggle = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((empId) => empId !== id) : [...prev, id]
    );
  };

  const handleSelectAllEmployees = () => {
    if (!filteredEmployees) return;
    const allIds = filteredEmployees.map(e => e.userId).filter(Boolean) as string[];
    setSelectedEmployeeIds(allIds);
  };

  const handleDeselectAllEmployees = () => {
    setSelectedEmployeeIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast({
        title: "Validation Error",
        description: "Please select a customer site from the list.",
        variant: "destructive",
      });
      return;
    }

    if (selectedEmployeeIds.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one employee to assign.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a description of the work.",
        variant: "destructive",
      });
      return;
    }

    if (!scheduledTime) {
      toast({
        title: "Validation Error",
        description: "Please select a scheduled date and time.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      employeeUserIds: selectedEmployeeIds,
      jobType,
      description: description.trim(),
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      address: selectedCustomer.address,
      scheduledTime: new Date(scheduledTime).toISOString(),
      taskRate: taskRate ? parseFloat(taskRate) : null,
    };

    assignBulkTasksMutation.mutate(
      { data: payload },
      {
        onSuccess: (data) => {
          toast({
            title: "Tasks Assigned",
            description: `Successfully assigned tasks to ${selectedEmployeeIds.length} employee(s).`,
          });
          // Reset form
          setSelectedCustomer(null);
          setCustomerSearch("");
          setSelectedEmployeeIds([]);
          setDescription("");
          setScheduledTime("");
          setTaskRate("");
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast({
            title: "Assignment Failed",
            description: error?.error || error?.message || "Something went wrong while assigning tasks.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6 border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Assign Task in Bulk
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Select a customer site, choose multiple active employees, fill in the work description, and schedule it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-3">
          {/* Site/Customer Selection */}
          <div ref={customerDropdownRef} className="space-y-2 relative">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Select Customer Site
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search customers by name, city, or phone..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSelectedCustomer(null);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="pl-9 pr-4 h-10 border-slate-200 focus:ring-primary focus:border-primary"
              />
              {selectedCustomer && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>

            {showCustomerDropdown && (
              <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto mt-1 divide-y divide-slate-100">
                {customersLoading ? (
                  <div className="p-3 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading customers...
                  </div>
                ) : filteredCustomers && filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex flex-col gap-0.5"
                    >
                      <span className="font-semibold text-slate-800 text-sm">{c.name}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 shrink-0" /> {c.city} | <Phone className="h-3 w-3 shrink-0" /> {c.phone}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-sm text-slate-500">No customers found</div>
                )}
              </div>
            )}

            {/* Selected Customer Site Details Card */}
            {selectedCustomer && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm space-y-2 mt-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Building className="h-4 w-4 text-slate-500" /> {selectedCustomer.name}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-4 w-4 text-slate-400" /> {selectedCustomer.phone}
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <span>{selectedCustomer.address}</span>
                </div>
              </div>
            )}
          </div>

          {/* Employee Selection Checklist */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Assign Employees ({selectedEmployeeIds.length} Selected)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllEmployees}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Select Filtered
                </button>
                <span className="text-slate-350">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAllEmployees}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-600 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Employee Filters */}
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter employees..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-md pl-8 pr-3 h-8 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent bg-white"
                />
              </div>
              <select
                value={employeeZoneFilter}
                onChange={(e) => setEmployeeZoneFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-md px-2 h-8 bg-white text-slate-600"
              >
                <option value="all">All Zones</option>
                {uniqueZones.map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>

            {/* Employee Checkboxes Box */}
            <div className="border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto bg-slate-50/50 space-y-2">
              {employeesLoading ? (
                <div className="text-center py-6 text-xs text-slate-400 flex items-center justify-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Loading active employees...
                </div>
              ) : filteredEmployees && filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => {
                  const isChecked = selectedEmployeeIds.includes(emp.userId ?? "");
                  return (
                    <label
                      key={emp.id}
                      className={`flex items-center gap-3 p-2 rounded-md border transition-all cursor-pointer select-none ${
                        isChecked
                          ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                          : "bg-white border-slate-100 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => emp.userId && handleEmployeeToggle(emp.userId)}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1 flex justify-between items-center min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="h-4 w-4 text-slate-450 shrink-0" />
                          <span className="font-semibold text-slate-800 text-xs truncate">
                            {emp.name}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase truncate shrink-0">
                            {emp.role.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium shrink-0 flex items-center gap-0.5">
                          <MapPin className="h-3 w-3 text-slate-400" /> {emp.zone}
                        </span>
                      </div>
                    </label>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">No active employees match filter</div>
              )}
            </div>
          </div>

          {/* Job Details & Date-Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Job Type
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-md h-10 px-3 bg-white text-slate-800 focus:ring-primary focus:border-primary"
              >
                {JOB_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Schedule Date & Time
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md h-10 pl-9 pr-3 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Task Rate Cost input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Task Rate / Cost (INR)
            </label>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 5000"
              value={taskRate}
              onChange={(e) => setTaskRate(e.target.value)}
              className="border-slate-200 focus:ring-primary focus:border-primary text-sm bg-white"
            />
          </div>

          {/* Work Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Work Description
            </label>
            <Textarea
              placeholder="Provide clean instructions about the service, installation, panel count or inspection items..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] border-slate-200 focus:ring-primary focus:border-primary resize-none text-sm bg-white"
            />
          </div>

          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assignBulkTasksMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={assignBulkTasksMutation.isPending}
              className="gradient-bg text-white hover:opacity-95 transition-opacity"
            >
              {assignBulkTasksMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning Tasks...
                </>
              ) : (
                `Assign Tasks to ${selectedEmployeeIds.length} Employee(s)`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
