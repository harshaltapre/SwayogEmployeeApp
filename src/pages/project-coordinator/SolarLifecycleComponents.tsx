import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  Clock,
  Compass,
  FileCheck,
  FileText,
  HardHat,
  Layers,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Users,
  Zap,
  Building2,
  Calendar,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { CustomerRecord, EmployeeRecord, InventoryRecord } from "@/lib/api-client";
import { format } from "date-fns";

export interface LifecycleStepDef {
  step: number;
  name: string;
  dept: string;
  badgeClass: string;
  desc: string;
  phase: string;
}

export const SOLAR_LIFECYCLE_STEPS: LifecycleStepDef[] = [
  {
    step: 1,
    name: "Site Survey & Feasibility",
    dept: "Site Survey",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    desc: "Detailed roof measurement, shadow analysis, structure load check, and site photos.",
    phase: "Phase 1: Feasibility",
  },
  {
    step: 2,
    name: "Document Collection",
    dept: "Liaisoning",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
    desc: "Electricity bills, Aadhaar card, property tax receipt, and customer signature on application.",
    phase: "Phase 1: Feasibility",
  },
  {
    step: 3,
    name: "Approval & Advance Payment",
    dept: "Accounts & Finance",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    desc: "Agreement signing and 1st milestone advance booking payment received.",
    phase: "Phase 2: Permitting & Finance",
  },
  {
    step: 4,
    name: "Licensing & Discom Sanction",
    dept: "Liaisoning",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
    desc: "Discom grid feasibility approval, technical feasibility report, and sanction letter.",
    phase: "Phase 2: Permitting & Finance",
  },
  {
    step: 5,
    name: "2nd Instalment (Procurement)",
    dept: "Accounts & Finance",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    desc: "Pre-procurement milestone payment cleared by accounts department.",
    phase: "Phase 2: Permitting & Finance",
  },
  {
    step: 6,
    name: "Procurement & Material Allocation",
    dept: "Inventory & Store",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
    desc: "Solar PV panels, solar inverter, mounting structures, and DC/AC cables allocated in store.",
    phase: "Phase 3: Procurement & Dispatch",
  },
  {
    step: 7,
    name: "Vendor Selection & Dispatch",
    dept: "Store & Dispatch",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300",
    desc: "EPC contractor / field execution team assigned; materials safely dispatched to site.",
    phase: "Phase 3: Procurement & Dispatch",
  },
  {
    step: 8,
    name: "Installation & Execution",
    dept: "EPC / Execution",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-300",
    desc: "Module mounting structure assembly, panel fixing, inverter wiring, and earth pit installation.",
    phase: "Phase 4: Execution & Quality",
  },
  {
    step: 9,
    name: "Work Completion Report (WCR)",
    dept: "Quality & Inspection",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    desc: "Quality inspection checklist, electrical safety check, WCR signed, and site photos verified.",
    phase: "Phase 4: Execution & Quality",
  },
  {
    step: 10,
    name: "3rd Instalment",
    dept: "Accounts & Finance",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    desc: "Post-installation milestone payment received before net metering synchronization.",
    phase: "Phase 5: Metering & Handover",
  },
  {
    step: 11,
    name: "Net Metering & Subsidy Redeem",
    dept: "Liaisoning",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-300",
    desc: "Discom bi-directional net meter installed, testing done, and subsidy claim submitted.",
    phase: "Phase 5: Metering & Handover",
  },
  {
    step: 12,
    name: "System Handover & Commissioning",
    dept: "Commissioning",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    desc: "Inverter online sync, telemetry live on customer portal, warranty cards, and handover sign-off.",
    phase: "Phase 5: Metering & Handover",
  },
];

export function getStepInfo(stage?: number | null): LifecycleStepDef {
  const safeStage = Math.max(0, Math.min(11, stage ?? 0));
  return SOLAR_LIFECYCLE_STEPS[safeStage];
}

export function getProgressPercent(stage?: number | null): number {
  if (stage === undefined || stage === null || stage < 0) return 0;
  if (stage >= 11) return 100;
  return Math.round(((stage + 1) / SOLAR_LIFECYCLE_STEPS.length) * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. FULL 12-STEP LIFECYCLE DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface LifecycleDetailModalProps {
  customer: CustomerRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onAdvanceStage: (customer: CustomerRecord) => Promise<void>;
  onSetStage: (customer: CustomerRecord, stageIndex: number) => Promise<void>;
  isUpdating: boolean;
}

export function LifecycleDetailModal({
  customer,
  isOpen,
  onClose,
  onAdvanceStage,
  onSetStage,
  isUpdating,
}: LifecycleDetailModalProps) {
  if (!customer) return null;
  const currentStage = Math.max(0, Math.min(11, customer.projectStage ?? 0));
  const progress = getProgressPercent(currentStage);
  const currentStep = getStepInfo(currentStage);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-600" />
                Solar Project Lifecycle: {customer.name}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Customer Code: <span className="font-mono font-semibold text-slate-800">{customer.customerCode || `#CUST-${customer.id}`}</span>
                {" · "}{customer.city || "Site City"} · System Size: <span className="font-semibold text-emerald-700">{customer.systemSizeKw || 3} kW Rooftop</span>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={currentStep.badgeClass}>
                Stage {currentStage + 1} of 12: {currentStep.name}
              </Badge>
              <span className="text-xs font-bold font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">
                {progress}% Complete
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-3">
          {/* Progress Bar & Quick Advance */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2">
              <span>Overall Project Progression</span>
              <span className="font-bold text-slate-900">{progress}% Completed</span>
            </div>
            <Progress value={progress} className="h-2.5 bg-slate-200" />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                Current Responsible Department:{" "}
                <Badge variant="outline" className="ml-1 font-bold text-slate-800">
                  {currentStep.dept}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {currentStage < 11 ? (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 text-xs shadow-xs"
                    onClick={() => onAdvanceStage(customer)}
                    disabled={isUpdating}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Advance to Next Stage
                  </Button>
                ) : (
                  <Badge className="bg-green-600 text-white px-3 py-1 font-bold text-xs">
                    ✓ Project Fully Commissioned
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Project & Hardware Quick Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Assigned EPC</span>
              <div className="font-semibold text-slate-800 mt-0.5">{customer.assignedEpc || "In-house / Not assigned"}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Panel Brand</span>
              <div className="font-semibold text-slate-800 mt-0.5">{customer.panelBrand || "Waaree / Tier-1"}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Inverter Brand</span>
              <div className="font-semibold text-slate-800 mt-0.5">{customer.inverterBrand || "Growatt / Solis"}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Inverter Serial No.</span>
              <div className="font-mono font-semibold text-slate-800 mt-0.5 truncate">{customer.inverterSrNo || customer.inverterDeviceSn || "Pending Installation"}</div>
            </div>
          </div>

          {/* 12-Step Visual Timeline */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
              <Compass className="h-4 w-4 text-emerald-600" /> End-to-End Solar Lifecycle Milestones
            </h3>
            <div className="space-y-3">
              {SOLAR_LIFECYCLE_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStage;
                const isCurrent = idx === currentStage;
                const isUpcoming = idx > currentStage;

                return (
                  <div
                    key={step.step}
                    className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all ${
                      isCurrent
                        ? "bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs"
                        : isCompleted
                          ? "bg-slate-50/50 border-slate-200"
                          : "bg-white border-slate-100 opacity-60"
                    }`}
                  >
                    {/* Step Icon */}
                    <div className="shrink-0 mt-0.5">
                      {isCompleted ? (
                        <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-300 shadow-2xs">
                          ✓
                        </div>
                      ) : isCurrent ? (
                        <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs animate-pulse">
                          {step.step}
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs border border-slate-200">
                          {step.step}
                        </div>
                      )}
                    </div>

                    {/* Step Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${isCurrent ? "text-emerald-900" : isCompleted ? "text-slate-900" : "text-slate-600"}`}>
                            Stage {step.step}: {step.name}
                          </p>
                          <Badge variant="outline" className={`text-[10px] font-semibold ${step.badgeClass}`}>
                            {step.dept}
                          </Badge>
                        </div>
                        <div>
                          {isCompleted && (
                            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="h-3 w-3 animate-spin" /> In Progress
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="text-[11px] text-slate-400">Upcoming Milestone</span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mt-1">{step.desc}</p>
                    </div>

                    {/* Stage Switch Action */}
                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-bold text-slate-500 hover:text-emerald-700 h-7 px-2 shrink-0"
                        onClick={() => onSetStage(customer, idx)}
                        disabled={isUpdating}
                      >
                        Set as Active
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ASSIGN TEAM & EPC MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface AssignTeamModalProps {
  customer: CustomerRecord | null;
  employees: EmployeeRecord[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerId: number, epc: string, employeeId: string) => Promise<void>;
  isSaving: boolean;
}

export function AssignTeamModal({
  customer,
  employees,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: AssignTeamModalProps) {
  const [epcName, setEpcName] = useState(customer?.assignedEpc || "");
  const [engineerId, setEngineerId] = useState(customer?.assignedEmployeeId || "");

  React.useEffect(() => {
    if (customer) {
      setEpcName(customer.assignedEpc || "");
      setEngineerId(customer.assignedEmployeeId || "");
    }
  }, [customer]);

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Assign Project Execution Team
          </DialogTitle>
          <DialogDescription>
            Assign an EPC contractor and a lead project engineer to oversee <strong>{customer.name}</strong> ({customer.systemSizeKw || 3} kW).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">EPC Partner / Installation Agency</label>
            <Input
              placeholder="e.g. Swayog In-house Team, K-Solar EPC, SunPower Solutions"
              value={epcName}
              onChange={(e) => setEpcName(e.target.value)}
            />
            <p className="text-[11px] text-slate-500">The contractor or crew executing the rooftop solar installation.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Project / Field Engineer</label>
            <Select value={engineerId} onValueChange={setEngineerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select lead engineer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">-- Unassigned --</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.userId || emp.id} value={emp.userId || String(emp.id)}>
                    {emp.name} ({emp.role || "Engineer"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-500">Responsible for site supervision, quality audits, and WCR report.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            onClick={() => onSave(customer.id, epcName, engineerId === "unassigned" ? "" : engineerId)}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Team Allocation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMMISSIONING & INVERTER SYNC MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface CommissioningModalProps {
  customer: CustomerRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerId: number, inverterSrNo: string, dataLoggerSrNo: string, inverterBrand: string) => Promise<void>;
  isSaving: boolean;
}

export function CommissioningModal({
  customer,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: CommissioningModalProps) {
  const [inverterSrNo, setInverterSrNo] = useState("");
  const [dataLoggerSrNo, setDataLoggerSrNo] = useState("");
  const [inverterBrand, setInverterBrand] = useState("");

  React.useEffect(() => {
    if (customer) {
      setInverterSrNo(customer.inverterSrNo || customer.inverterDeviceSn || "");
      setDataLoggerSrNo(customer.dataLoggerSrNo || "");
      setInverterBrand(customer.inverterBrand || "Growatt");
    }
  }, [customer]);

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Inverter Telemetry &amp; Commissioning
          </DialogTitle>
          <DialogDescription>
            Configure inverter hardware identifiers for <strong>{customer.name}</strong> to enable real-time telemetry and cloud sync.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Inverter Manufacturer</label>
            <Select value={inverterBrand} onValueChange={setInverterBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Select inverter brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Growatt">Growatt</SelectItem>
                <SelectItem value="Waaree">Waaree</SelectItem>
                <SelectItem value="Solis">Solis</SelectItem>
                <SelectItem value="SolarEdge">SolarEdge</SelectItem>
                <SelectItem value="FoxESS">FoxESS</SelectItem>
                <SelectItem value="Sungrow">Sungrow</SelectItem>
                <SelectItem value="UTL">UTL Solar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Inverter Serial Number (SN)</label>
            <Input
              placeholder="e.g. TLX12345678"
              value={inverterSrNo}
              onChange={(e) => setInverterSrNo(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Data Logger / ShineWiFi Dongle Serial Number</label>
            <Input
              placeholder="e.g. BCM987654321"
              value={dataLoggerSrNo}
              onChange={(e) => setDataLoggerSrNo(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            onClick={() => onSave(customer.id, inverterSrNo, dataLoggerSrNo, inverterBrand)}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Commissioning Specs"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. MATERIAL DISPATCH REQUEST MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface MaterialDispatchModalProps {
  customer: CustomerRecord | null;
  inventory: InventoryRecord[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customerId: number, itemId: number, quantity: number, notes?: string) => Promise<void>;
  isSubmitting: boolean;
}

export function MaterialDispatchModal({
  customer,
  inventory,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: MaterialDispatchModalProps) {
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");

  if (!customer) return null;

  const selectedItem = inventory.find((i) => String(i.id) === String(itemId));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Dispatch Solar Materials to Site
          </DialogTitle>
          <DialogDescription>
            Reserve and dispatch equipment from inventory for <strong>{customer.name}</strong> ({customer.city || "Project Site"}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Select Inventory Equipment</label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose material / equipment..." />
              </SelectTrigger>
              <SelectContent>
                {inventory.map((inv) => (
                  <SelectItem key={inv.id} value={String(inv.id)}>
                    {inv.name} ({inv.inStock} {inv.unit || "unit"} in stock)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedItem && (
              <p className="text-[11px] text-slate-500">
                Available in warehouse: <strong className="text-slate-800">{selectedItem.inStock} {selectedItem.unit || "unit"}</strong>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Dispatch Quantity</label>
            <Input
              type="number"
              min="1"
              max={selectedItem?.inStock ? String(selectedItem.inStock) : "999"}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Dispatch Notes / Transport Reference</label>
            <Input
              placeholder="e.g. Dispatched via Vehicle MH-12-AB-1234 with Driver Ramesh"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
            onClick={() => onSubmit(customer.id, Number(itemId), Number(quantity), notes)}
            disabled={isSubmitting || !itemId || !quantity || Number(quantity) <= 0}
          >
            {isSubmitting ? "Dispatching..." : "Confirm Material Dispatch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
