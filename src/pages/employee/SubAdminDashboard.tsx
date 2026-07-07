import { useEffect, useMemo, useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { useAuth } from "@/lib/auth";
import {
  getEffectiveApiBaseUrl,
  useGetCustomerInverterGeneration,
  useGetCustomerInverterGenerationHistory,
  useGetSubadminCustomerSummary,
  useListCustomers,
  useUpdateSubadminCustomerCredentials,
  useListAmcVisits,
  useListEmployees,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RefreshCw, AlertCircle, Zap, MapPin, Phone, Award, Calendar, Wrench, User, CheckCircle2, Clock, ChevronsUpDown, Check } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export default function SubAdminDashboard() {
  const { user, token } = useAuth();
  const apiBase = getEffectiveApiBaseUrl();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"realtime" | "daily" | "monthly" | "yearly">("realtime");
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [modalBrand, setModalBrand] = useState("");
  const [modalConnectionType, setModalConnectionType] = useState("Simulation");

  const parseBrandAndType = (brandStr: string) => {
    const brandLower = (brandStr || "").toLowerCase();
    
    let brand = "";
    if (brandLower.includes("ksolar") || brandLower.includes("k-solar")) brand = "KSolar";
    else if (brandLower.includes("growatt")) brand = "Growatt";
    else if (brandLower.includes("utl") || brandLower.includes("foxess")) brand = "UTL";
    else if (brandLower.includes("pvblink")) brand = "PVBlink";
    else if (brandLower.includes("waaree")) brand = "Waaree";
    else if (brandLower.includes("vsole")) brand = "Vsole";
    else if (brandLower.includes("solarman")) brand = "Solarman";
    else if (brandLower.includes("havells")) brand = "Havells";
    else if (brandLower.includes("anchor")) brand = "Anchor";
    else brand = brandStr || "";

    let connectionType = "Simulation";
    if (brandLower.includes("(solarman)")) connectionType = "Solarman";
    else if (brandLower.includes("(solis)")) connectionType = "Solis";
    else if (brandLower.includes("(shinemonitor)")) connectionType = "ShineMonitor";
    else if (brandLower.includes("(foxess)")) connectionType = "FoxESS";
    else if (brandLower.includes("(growattportal)")) connectionType = "GrowattPortal";
    else if (brandLower.includes("(growatt)")) connectionType = "GrowattPortal";
    else if (brandLower.includes("(waaree)")) connectionType = "Waaree";
    else if (brandLower.includes("solarman") && brand === "Solarman") connectionType = "Solarman";
    else if ((brandLower.includes("ksolar") || brandLower.includes("k-solar")) && brand === "KSolar") connectionType = "ShineMonitor";
    else if (brandLower.includes("growatt") && brand === "Growatt") connectionType = "GrowattPortal";
    else if ((brandLower.includes("utl") || brandLower.includes("foxess")) && brand === "UTL") connectionType = "FoxESS";
    else if (brandLower.includes("waaree") && brand === "Waaree") connectionType = "Waaree";

    return { brand, connectionType };
  };

  const [credentialDraft, setCredentialDraft] = useState({
    inverterBrand: "",
    inverterLoginId: "",
    inverterPassword: "",
    inverterApiKey: "",
    inverterDeviceSn: "",
    city: "",
    address: "",
    projectStage: "",
  });
  const [credentialError, setCredentialError] = useState<string | null>(null);

  const {
    data: customers = [],
    isLoading: isLoadingCustomers,
    refetch: refetchCustomers,
  } = useListCustomers({ limit: 200, city: selectedCity || undefined });

  const {
    data: selectedCustomerSummary,
    isLoading: isLoadingCustomerSummary,
    refetch: refetchCustomerSummary,
  } = useGetSubadminCustomerSummary(selectedCustomerId ?? -1, {
    enabled: selectedCustomerId !== null,
  });

  const {
    data: inverterSummary,
    error: inverterSummaryError,
    isLoading: isLoadingInverterSummary,
    refetch: refetchInverterSummary,
  } = useGetCustomerInverterGeneration(selectedCustomerId ?? -1, {
    enabled: selectedCustomerId !== null,
    retry: false,
  });

  const {
    data: inverterHistory = [],
    error: inverterHistoryError,
    isLoading: isLoadingInverterHistory,
    refetch: refetchInverterHistory,
  } = useGetCustomerInverterGenerationHistory(selectedCustomerId ?? -1, selectedPeriod, {
    enabled: selectedCustomerId !== null,
    retry: false,
  });

  const {
    data: amcVisits = [],
    isLoading: isLoadingAmcVisits,
    refetch: refetchAmcVisits,
  } = useListAmcVisits({ customerId: selectedCustomerId ?? undefined }, {
    enabled: selectedCustomerId !== null,
  });

  const { data: employees = [] } = useListEmployees();

  const updateCredentialsMutation = useUpdateSubadminCustomerCredentials({
    mutation: {
      onSuccess: async (data, variables) => {
        setIsCredentialModalOpen(false);
        setCredentialError(null);

        refetchCustomerSummary();
        refetchInverterSummary();
        refetchInverterHistory();
        refetchCustomers();
      },
      onError: (error: unknown) => {
        const message =
          typeof error === "object" && error !== null && "error" in error
            ? (error as any).error
            : "Failed to update credentials.";
        setCredentialError(String(message));
      },
    },
  });

  const isSavingCredentials = updateCredentialsMutation.status === "pending";

  const selectedCustomer = selectedCustomerSummary?.customer;

  const { brand: selectedBrand, connectionType: selectedConnectionType } = useMemo(() => {
    return parseBrandAndType(selectedCustomer?.inverterBrand || "");
  }, [selectedCustomer?.inverterBrand]);

  const customerOptions = useMemo(
    () => [...customers].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [customers],
  );

  const cityOptions = useMemo(
    () => Array.from(new Set(customers.filter((customer) => customer.city).map((customer) => customer.city))).sort(),
    [customers],
  );

  const refreshAll = async () => {
    await Promise.all([
      refetchCustomers(),
      refetchCustomerSummary(),
      refetchInverterSummary(),
      refetchInverterHistory(),
      refetchAmcVisits(),
    ]);
  };

  useEffect(() => {
    if (!selectedCustomerId) return;
    const interval = setInterval(() => {
      console.log(`[Waaree Polling] Auto-refreshing telemetry for customer ${selectedCustomerId}...`);
      refetchInverterSummary();
      refetchInverterHistory();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedCustomerId, refetchInverterSummary, refetchInverterHistory]);

  const isAnyLoading = isLoadingCustomers || isLoadingCustomerSummary || isLoadingInverterSummary || isLoadingInverterHistory || isLoadingAmcVisits;

  // Extract explicit error messages from fetch states
  const inverterErrorMsg = useMemo(() => {
    if (!inverterSummaryError) return null;
    return typeof inverterSummaryError === "object" && "error" in inverterSummaryError
      ? String((inverterSummaryError as any).error)
      : String(inverterSummaryError);
  }, [inverterSummaryError]);

  const historyErrorMsg = useMemo(() => {
    if (!inverterHistoryError) return null;
    return typeof inverterHistoryError === "object" && "error" in inverterHistoryError
      ? String((inverterHistoryError as any).error)
      : String(inverterHistoryError);
  }, [inverterHistoryError]);

  return (
    <SidebarLayout>
      <div className="space-y-4 md:space-y-6 pb-20 animate-in fade-in zoom-in-95 duration-500 mt-4">
        {/* Welcome Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
              Welcome, <span className="text-secondary">{user?.name}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Service Coordinator Portal — Select client and city to view active solar generation details.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={refreshAll}
            disabled={isAnyLoading}
            className="w-full gap-2 sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isAnyLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Client Selection Card */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-800">Select Client & City</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Choose a customer and filter by city to review inverter status and real-time solar metrics.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Client / Customer</label>
                <Popover open={isCustomerSelectOpen} onOpenChange={setIsCustomerSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isCustomerSelectOpen}
                      className="w-full justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm outline-none hover:bg-slate-50 text-left h-10 text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors duration-200"
                    >
                      <span className="truncate">
                        {(() => {
                          const selected = customerOptions.find((c) => c.id === selectedCustomerId);
                          return selected
                            ? `${selected.customerCode ? `${selected.customerCode} · ` : ""}${selected.name}`
                            : "Select a customer";
                        })()}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search customer name or code..." className="h-9" />
                      <CommandList className="max-h-[300px] overflow-y-auto">
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                          {customerOptions.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={`${customer.customerCode || ""} ${customer.name || ""} ${customer.id}`.toLowerCase()}
                              onSelect={() => {
                                setSelectedCustomerId(customer.id);
                                setIsCustomerSelectOpen(false);
                              }}
                              className="flex items-center justify-between px-3 py-2 cursor-pointer transition-colors duration-150"
                            >
                              <div className="flex items-center truncate mr-2">
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 shrink-0 text-primary",
                                    selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="truncate font-medium text-slate-700">
                                  {customer.customerCode ? `${customer.customerCode} · ` : ""}
                                  {customer.name}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">City filter</label>
                <select
                  value={selectedCity}
                  onChange={(event) => setSelectedCity(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 font-medium"
                >
                  <option value="">All cities</option>
                  {cityOptions.map((city: any) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedCustomer ? (
          <>
            {/* Service Coordinator Activity Stats Block */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* AMC Cleanings Summary Block */}
              <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                      AMC Cleaning Summary
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Monthly cleaning schedule & status</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-250/50 hover:bg-emerald-50 hover:text-emerald-700 border text-[10px] font-bold py-0.5 px-2">
                    {selectedCustomer.cleaningsPerMonth ?? 2} / month
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly Limit</span>
                      <span className="mt-1 text-sm font-black text-slate-800 block">{selectedCustomer.cleaningsPerMonth ?? 2}</span>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Completed</span>
                      <span className="mt-1 text-sm font-black text-emerald-700 block">{selectedCustomer.completedVisits ?? 0}</span>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending</span>
                      <span className="mt-1 text-sm font-black text-amber-700 block">{selectedCustomer.pendingVisits ?? 0}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 px-1">
                      <span>Cleaning Completion Progress</span>
                      <span>
                        {Math.round(((selectedCustomer.completedVisits ?? 0) / Math.max(selectedCustomer.cleaningsPerMonth ?? 2, 1)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.round(((selectedCustomer.completedVisits ?? 0) / Math.max(selectedCustomer.cleaningsPerMonth ?? 2, 1)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Requests & Complaints Block */}
              <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
                      Complaints & Service Requests
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Active tickets & resolutions</p>
                  </div>
                  <Badge className="bg-blue-50 text-blue-750 border-blue-200/60 hover:bg-blue-50 hover:text-blue-750 border text-[10px] font-bold py-0.5 px-2">
                    {selectedCustomerSummary?.serviceRequestStats?.total ?? 0} Total
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending</span>
                      <span className="mt-1 text-sm font-black text-rose-600 block">
                        {selectedCustomerSummary?.serviceRequestStats?.pending ?? 0}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Scheduled</span>
                      <span className="mt-1 text-sm font-black text-blue-600 block">
                        {selectedCustomerSummary?.serviceRequestStats?.scheduled ?? 0}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Resolved</span>
                      <span className="mt-1 text-sm font-black text-emerald-700 block">
                        {selectedCustomerSummary?.serviceRequestStats?.completed ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 px-1">
                      <span>Resolution Rate</span>
                      <span>
                        {selectedCustomerSummary?.serviceRequestStats?.total 
                          ? Math.round(((selectedCustomerSummary.serviceRequestStats.completed ?? 0) / selectedCustomerSummary.serviceRequestStats.total) * 100) 
                          : 100}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${selectedCustomerSummary?.serviceRequestStats?.total 
                            ? Math.min(100, Math.round(((selectedCustomerSummary.serviceRequestStats.completed ?? 0) / selectedCustomerSummary.serviceRequestStats.total) * 100)) 
                            : 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AMC Cleaning Visits Detail List ("and so on cleaning visit") */}
            <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-650 shrink-0" />
                  AMC Cleaning Visit Log & Schedule
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Timeline of scheduled and completed visits</p>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoadingAmcVisits ? (
                  <div className="text-center py-6 text-slate-500 text-xs">Loading cleaning visits...</div>
                ) : amcVisits.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">No cleaning visits scheduled for this customer.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Clean #</th>
                          <th className="py-2.5 px-3">Scheduled Date</th>
                          <th className="py-2.5 px-3">Time Slot</th>
                          <th className="py-2.5 px-3">Assigned Technician</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Completed By / Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {amcVisits.map((visit) => {
                          const technician = employees.find(e => e.userId === visit.assignedEmployeeId || String(e.id) === visit.assignedEmployeeId)?.name || "Unassigned";
                          const isCompleted = visit.status === "completed";
                          return (
                            <tr key={visit.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-slate-700">
                                Cleaning {visit.cleaningNumber || "—"}
                              </td>
                              <td className="py-2.5 px-3 text-slate-650 font-medium">
                                {visit.scheduledDate ? new Date(visit.scheduledDate).toLocaleDateString("en-IN") : "—"}
                              </td>
                              <td className="py-2.5 px-3 text-slate-650 font-medium">
                                {visit.timeSlot || "—"}
                              </td>
                              <td className="py-2.5 px-3 text-slate-650 font-medium flex items-center gap-1.5">
                                <User className="h-3 w-3 text-slate-400" />
                                {technician}
                              </td>
                              <td className="py-2.5 px-3">
                                <Badge 
                                  variant="outline" 
                                  className={`font-bold text-[10px] uppercase px-2 py-0.5 rounded ${
                                    isCompleted 
                                      ? "bg-green-50 text-green-700 border-green-200" 
                                      : "bg-amber-50 text-amber-700 border-amber-250/50"
                                  }`}
                                >
                                  {visit.status}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3 text-slate-650">
                                {isCompleted ? (
                                  <div>
                                    <span className="font-semibold text-slate-800">{visit.completedByName || "Technician"}</span>
                                    <span className="text-[10px] text-slate-400 ml-1.5">
                                      ({visit.completedAt ? new Date(visit.completedAt).toLocaleDateString("en-IN") : "—"})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Split Details Section */}
            <div className="grid gap-4 xl:grid-cols-[1.2fr,1fr]">
              {/* Left Column: Customer & Inverter info */}
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="pb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100">
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800">Customer & Inverter Details</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Contact information and inverter parameters.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start gap-1"
                    onClick={() => {
                      const { brand, connectionType } = parseBrandAndType(selectedCustomer.inverterBrand || "");
                      setModalBrand(brand);
                      setModalConnectionType(connectionType);
                      setCredentialDraft({
                        inverterBrand: selectedCustomer.inverterBrand ?? "",
                        inverterLoginId: selectedCustomer.inverterLoginId ?? "",
                        inverterPassword: selectedCustomer.inverterPassword ?? "",
                        inverterApiKey: selectedCustomer.inverterApiKey ?? "",
                        inverterDeviceSn: selectedCustomer.inverterDeviceSn ?? "",
                        city: selectedCustomer.city ?? "",
                        address: selectedCustomer.address ?? "",
                        projectStage: selectedCustomer.projectStage?.toString() ?? "",
                      });
                      setCredentialError(null);
                      setIsCredentialModalOpen(true);
                    }}
                  >
                    Update credentials
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-4 rounded-xl bg-slate-50/50 p-4 border border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer Details</p>
                        <p className="mt-2 text-base font-bold text-slate-800">{selectedCustomer.name}</p>
                        <p className="text-xs font-semibold text-slate-500 font-mono mt-0.5">{selectedCustomer.customerCode}</p>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 text-sm">
                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 text-sm">
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{selectedCustomer.city}</span>
                      </div>
                      <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-200/60 pt-3">
                        <span className="font-semibold block text-[10px] text-slate-400 uppercase mb-1">Site Address</span>
                        {selectedCustomer.address || "Not available"}
                      </div>
                    </div>

                    <div className="space-y-4 rounded-xl bg-slate-50/50 p-4 border border-slate-100">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/50 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">System Information</span>
                        <div className="flex items-center gap-1.5">
                          <Badge className="bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded">
                            {selectedBrand ?? "Unknown"}
                          </Badge>
                          {selectedConnectionType !== "Simulation" && (
                            <Badge className="bg-primary/95 text-white text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded border-none">
                              {selectedConnectionType}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Installed Capacity</span>
                          <span className="font-bold text-slate-700 mt-0.5 block">
                            {selectedCustomer.systemSizeKw ? `${selectedCustomer.systemSizeKw} kW` : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">AMC Status</span>
                          <span className="font-bold text-slate-700 mt-0.5 block capitalize">
                            {selectedCustomer.amcStatus?.toLowerCase() || "None"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Client Type</span>
                          <span className="font-bold text-slate-700 mt-0.5 block capitalize">
                            {selectedCustomer.clientType?.replace("_", " ") || "Not set"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Installation Date</span>
                          <span className="font-semibold text-slate-600 mt-0.5 block">
                            {selectedCustomer.installationDate ? new Date(selectedCustomer.installationDate).toLocaleDateString("en-IN") : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-slate-200/60 pt-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          {(() => {
                            if (selectedConnectionType === "Growatt") return "Growatt API Token";
                            if (selectedConnectionType === "ShineMonitor") return "ShineMonitor Username";
                            if (selectedConnectionType === "FoxESS") return "FoxESS API Key";
                            if (selectedConnectionType === "Solarman") return "Solarman App ID (API Key)";
                            if (selectedConnectionType === "Solis") return "Solis API Key ID";
                            return "Inverter Login ID";
                          })()}
                        </span>
                        <span className="font-mono font-bold text-slate-700 text-xs truncate block max-w-full mt-1">
                          {selectedCustomer.inverterLoginId || (selectedCustomer.inverterApiKey ? "API Key Configured" : "Missing credentials")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column: Generation Summary card */}
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="pb-4 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800">Inverter Generation Summary</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Live telemetry metrics synchronized from system.
                    </p>
                  </div>
                  {inverterSummary && (
                    <Badge 
                      variant={inverterSummary.isSimulated ? "outline" : "default"} 
                      className={inverterSummary.isSimulated 
                        ? "bg-amber-50 text-amber-700 border-amber-200/80 font-bold text-[10px]" 
                        : "bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px]"}
                    >
                      {inverterSummary.isSimulated ? "Simulated Sync" : "Live API"}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  {isLoadingInverterSummary ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm font-medium">Fetching live telemetry...</span>
                    </div>
                  ) : inverterErrorMsg ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                      <div>
                        <p className="font-bold">Telemetry Connection Failed</p>
                        <p className="mt-1 leading-relaxed">{inverterErrorMsg}</p>
                      </div>
                    </div>
                  ) : inverterSummary ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm hover:border-slate-300 transition-colors">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Today's Yield</span>
                          <span className="mt-1 text-base font-black text-slate-800 block">{inverterSummary.dailyGeneration} <span className="text-xs font-normal">kWh</span></span>
                        </div>
                        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm hover:border-slate-300 transition-colors">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Current Power</span>
                          <span className="mt-1 text-base font-black text-slate-800 block">{inverterSummary.peakPower} <span className="text-xs font-normal">kW</span></span>
                        </div>
                        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm hover:border-slate-300 transition-colors">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Lifetime</span>
                          <span className="mt-1 text-base font-black text-slate-800 block">{inverterSummary.totalGeneration} <span className="text-xs font-normal">kWh</span></span>
                        </div>
                      </div>
                      
                      <div className="text-[11px] text-muted-foreground flex items-center justify-between px-1">
                        <span>Last synchronized:</span>
                        <span className="font-semibold">{inverterSummary.lastUpdated ? new Date(inverterSummary.lastUpdated).toLocaleString() : "N/A"}</span>
                      </div>

                      {/* ShineMonitor portal launcher */}
                      {selectedConnectionType === "ShineMonitor" && (
                        <div className="mt-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200/60 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                              <Award className="h-4 w-4 text-emerald-600 shrink-0" />
                              ShineMonitor Portal ({selectedBrand})
                            </p>
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2 py-0.5 rounded">Live Integration</Badge>
                          </div>
                          <p className="text-xs text-emerald-700 leading-relaxed">
                            Use the credentials below to log into the ShineMonitor platform and view full site parameters.
                          </p>
                          
                          <div className="grid gap-2 text-xs">
                            <div className="flex items-center justify-between bg-white/80 p-2 rounded border border-emerald-100">
                              <span className="font-medium text-slate-500">Username:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-800">{selectedCustomer.inverterLoginId}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1.5 text-emerald-700 hover:bg-emerald-100 text-[10px] font-semibold border border-emerald-200/50 rounded"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedCustomer.inverterLoginId || "");
                                    setCopiedUser(true);
                                    setTimeout(() => setCopiedUser(false), 2000);
                                  }}
                                >
                                  {copiedUser ? "Copied!" : "Copy"}
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between bg-white/80 p-2 rounded border border-emerald-100">
                              <span className="font-medium text-slate-500">Password:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-800">
                                  {copiedPass ? selectedCustomer.inverterPassword : "••••••••"}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1.5 text-emerald-700 hover:bg-emerald-100 text-[10px] font-semibold border border-emerald-200/50 rounded"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedCustomer.inverterPassword || "");
                                    setCopiedPass(true);
                                    setTimeout(() => setCopiedPass(false), 2000);
                                  }}
                                >
                                  {copiedPass ? "Copied!" : "Copy"}
                                </Button>
                              </div>
                            </div>
                          </div>

                          <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-2 h-9 text-xs"
                            onClick={() => {
                              window.open(
                                "https://ksolare.shinemonitor.com/cus/ksolareNew/index_in.html?1779693602982",
                                "_blank"
                              );
                            }}
                          >
                            Launch ShineMonitor Web Portal
                          </Button>
                        </div>
                      )}

                      {/* Growatt portal launcher */}
                      {selectedConnectionType === "Growatt" && (
                        <div className="mt-3 p-4 rounded-xl bg-sky-50 border border-sky-200/60 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1">
                              <Zap className="h-4 w-4 text-sky-600 shrink-0" />
                              Growatt ShineServer Portal ({selectedBrand})
                            </p>
                            <Badge className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-[9px] px-2 py-0.5 rounded">Live Integration</Badge>
                          </div>
                          <p className="text-xs text-sky-700 leading-relaxed">
                            Use the credentials below to log into the Growatt ShineServer platform and view plant outputs.
                          </p>
                          
                          <div className="grid gap-2 text-xs">
                            <div className="flex items-center justify-between bg-white/80 p-2 rounded border border-sky-100">
                              <span className="font-medium text-slate-500">Username:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-800">{selectedCustomer.inverterLoginId}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1.5 text-sky-700 hover:bg-sky-100 text-[10px] font-semibold border border-sky-200/50 rounded"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedCustomer.inverterLoginId || "");
                                    setCopiedUser(true);
                                    setTimeout(() => setCopiedUser(false), 2000);
                                  }}
                                >
                                  {copiedUser ? "Copied!" : "Copy"}
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between bg-white/80 p-2 rounded border border-sky-100">
                              <span className="font-medium text-slate-500">Password:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-800">
                                  {copiedPass ? selectedCustomer.inverterPassword : "••••••••"}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1.5 text-sky-700 hover:bg-sky-100 text-[10px] font-semibold border border-sky-200/50 rounded"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedCustomer.inverterPassword || "");
                                    setCopiedPass(true);
                                    setTimeout(() => setCopiedPass(false), 2000);
                                  }}
                                >
                                  {copiedPass ? "Copied!" : "Copy"}
                                </Button>
                              </div>
                            </div>
                          </div>

                          <Button
                            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-2 h-9 text-xs"
                            onClick={() => {
                              window.open(
                                "https://server.growatt.com/",
                                "_blank"
                              );
                            }}
                          >
                            Launch Growatt ShineServer Portal
                          </Button>
                        </div>
                      )}

                      {/* FoxESS portal launcher */}
                      {selectedConnectionType === "FoxESS" && (
                        <div className="mt-3 p-4 rounded-xl bg-orange-50 border border-orange-200/60 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-orange-800 flex items-center gap-1">
                              <Zap className="h-4 w-4 text-orange-600 shrink-0" />
                              FoxESS / UTL Portal ({selectedBrand})
                            </p>
                            <Badge className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-[9px] px-2 py-0.5 rounded">Live Integration</Badge>
                          </div>
                          <p className="text-xs text-orange-700 leading-relaxed">
                            Use the credentials below to log into the FoxESS Cloud platform and view system generation.
                          </p>
                          
                          <div className="grid gap-2 text-xs">
                            <div className="flex items-center justify-between bg-white/80 p-2 rounded border border-orange-100">
                              <span className="font-medium text-slate-500">API Key:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-800 truncate max-w-[140px]">{selectedCustomer.inverterApiKey || "N/A"}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1.5 text-orange-700 hover:bg-orange-100 text-[10px] font-semibold border border-orange-200/50 rounded"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedCustomer.inverterApiKey || "");
                                    setCopiedUser(true);
                                    setTimeout(() => setCopiedUser(false), 2000);
                                  }}
                                >
                                  {copiedUser ? "Copied!" : "Copy"}
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between bg-white/80 p-2 rounded border border-orange-100">
                              <span className="font-medium text-slate-500">Device SN:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-800">{selectedCustomer.inverterDeviceSn || "N/A"}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1.5 text-orange-700 hover:bg-orange-100 text-[10px] font-semibold border border-orange-200/50 rounded"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedCustomer.inverterDeviceSn || "");
                                    setCopiedPass(true);
                                    setTimeout(() => setCopiedPass(false), 2000);
                                  }}
                                >
                                  {copiedPass ? "Copied!" : "Copy"}
                                </Button>
                              </div>
                            </div>
                          </div>

                          <Button
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-2 h-9 text-xs"
                            onClick={() => {
                              window.open(
                                "https://www.foxesscloud.com/",
                                "_blank"
                              );
                            }}
                          >
                            Launch FoxESS Cloud Portal
                          </Button>
                        </div>
                      )}

                      {/* Solarman portal launcher */}
                      {selectedConnectionType === "Solarman" && (
                        <div className="mt-3 p-4 rounded-xl bg-blue-50 border border-blue-200/60 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                              <Zap className="h-4 w-4 text-blue-600 shrink-0" />
                              Solarman Portal ({selectedBrand})
                            </p>
                            <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] px-2 py-0.5 rounded">Live Integration</Badge>
                          </div>
                          <p className="text-xs text-blue-700 leading-relaxed">
                            Use the credentials below to log into the SolarmanPV platform and view plant outputs.
                          </p>
                          
                          <div className="grid gap-2 text-xs">
                            <div className="flex items-center justify-between bg-white/80 p-2 rounded border border-blue-100">
                              <span className="font-medium text-slate-500">App ID:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-800 truncate max-w-[140px]">{selectedCustomer.inverterApiKey || "N/A"}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1.5 text-blue-700 hover:bg-blue-100 text-[10px] font-semibold border border-blue-200/50 rounded"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedCustomer.inverterApiKey || "");
                                    setCopiedUser(true);
                                    setTimeout(() => setCopiedUser(false), 2000);
                                  }}
                                >
                                  {copiedUser ? "Copied!" : "Copy"}
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between bg-white/80 p-2 rounded border border-blue-100">
                              <span className="font-medium text-slate-500">Email Login:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-800">{selectedCustomer.inverterLoginId || "N/A"}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1.5 text-blue-700 hover:bg-blue-100 text-[10px] font-semibold border border-blue-200/50 rounded"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedCustomer.inverterLoginId || "");
                                    setCopiedPass(true);
                                    setTimeout(() => setCopiedPass(false), 2000);
                                  }}
                                >
                                  {copiedPass ? "Copied!" : "Copy"}
                                </Button>
                              </div>
                            </div>
                          </div>

                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-2 h-9 text-xs"
                            onClick={() => {
                              window.open(
                                "https://pro.solarmanpv.com/",
                                "_blank"
                              );
                            }}
                          >
                            Launch Solarman PV Portal
                          </Button>
                        </div>
                      )}

                      {/* SolisCloud portal launcher */}
                      {selectedConnectionType === "Solis" && (
                        <div className="mt-3 p-4 rounded-xl bg-violet-50 border border-violet-200/60 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-violet-800 flex items-center gap-1">
                              <Zap className="h-4 w-4 text-violet-600 shrink-0" />
                              SolisCloud Portal ({selectedBrand})
                            </p>
                            <Badge className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-[9px] px-2 py-0.5 rounded">Live Integration</Badge>
                          </div>
                          <p className="text-xs text-violet-700 leading-relaxed">
                            Use the credentials below to log into the SolisCloud platform and monitor plant telemetry.
                          </p>
                          
                          <div className="grid gap-2 text-xs">
                            <div className="flex items-center justify-between bg-white/80 p-2 rounded border border-violet-100">
                              <span className="font-medium text-slate-500">Key ID:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-800 truncate max-w-[140px]">{selectedCustomer.inverterApiKey || "N/A"}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1.5 text-violet-700 hover:bg-violet-100 text-[10px] font-semibold border border-violet-200/50 rounded"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedCustomer.inverterApiKey || "");
                                    setCopiedUser(true);
                                    setTimeout(() => setCopiedUser(false), 2000);
                                  }}
                                >
                                  {copiedUser ? "Copied!" : "Copy"}
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between bg-white/80 p-2 rounded border border-violet-100">
                              <span className="font-medium text-slate-500">Station ID:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-800">{selectedCustomer.inverterLoginId || "N/A"}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1.5 text-violet-700 hover:bg-violet-100 text-[10px] font-semibold border border-violet-200/50 rounded"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedCustomer.inverterLoginId || "");
                                    setCopiedPass(true);
                                    setTimeout(() => setCopiedPass(false), 2000);
                                  }}
                                >
                                  {copiedPass ? "Copied!" : "Copy"}
                                </Button>
                              </div>
                            </div>
                          </div>

                          <Button
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-2 h-9 text-xs"
                            onClick={() => {
                              window.open(
                                "https://www.soliscloud.com/",
                                "_blank"
                              );
                            }}
                          >
                            Launch SolisCloud Portal
                          </Button>
                        </div>
                      )}

                      {/* Waaree portal launcher */}
                      {selectedConnectionType === "Waaree" && (
                        <div className="mt-3 p-4 rounded-xl bg-teal-50 border border-teal-200/60 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1">
                              <Zap className="h-4 w-4 text-teal-650 shrink-0" />
                              Waaree Portal ({selectedBrand})
                            </p>
                            <Badge className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[9px] px-2 py-0.5 rounded">Live Integration</Badge>
                          </div>
                          <p className="text-xs text-teal-700 leading-relaxed">
                            Use the credentials below to log into the Waaree platform and monitor plant outputs.
                          </p>
                          
                          <div className="grid gap-2 text-xs">
                            <div className="flex items-center justify-between bg-white/80 p-2 rounded border border-teal-100/60">
                              <span className="font-medium text-slate-500">Username / Plant ID:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-800">
                                  {selectedCustomer.inverterLoginId || (selectedCustomer.inverterApiKey ? "API Key Configured" : "N/A")}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1.5 text-teal-700 hover:bg-teal-100 text-[10px] font-semibold border border-teal-200/50 rounded"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedCustomer.inverterLoginId || selectedCustomer.inverterApiKey || "");
                                    setCopiedUser(true);
                                    setTimeout(() => setCopiedUser(false), 2000);
                                  }}
                                >
                                  {copiedUser ? "Copied!" : "Copy"}
                                </Button>
                              </div>
                            </div>
                            
                            {selectedCustomer.inverterPassword && (
                              <div className="flex items-center justify-between bg-white/80 p-2 rounded border border-teal-100/60">
                                <span className="font-medium text-slate-500">Password:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-slate-800">
                                    {copiedPass ? selectedCustomer.inverterPassword : "••••••••"}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 px-1.5 text-teal-750 hover:bg-teal-100 text-[10px] font-semibold border border-teal-200/50 rounded"
                                    onClick={() => {
                                      navigator.clipboard.writeText(selectedCustomer.inverterPassword || "");
                                      setCopiedPass(true);
                                      setTimeout(() => setCopiedPass(false), 2000);
                                    }}
                                  >
                                    {copiedPass ? "Copied!" : "Copy"}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {selectedCustomer.inverterApiKey && (
                              <div className="flex items-center justify-between bg-white/80 p-2 rounded border border-teal-100/60">
                                <span className="font-medium text-slate-500">API Key:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-slate-800 truncate max-w-[140px]">{selectedCustomer.inverterApiKey}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 px-1.5 text-teal-750 hover:bg-teal-100 text-[10px] font-semibold border border-teal-200/50 rounded"
                                    onClick={() => {
                                      navigator.clipboard.writeText(selectedCustomer.inverterApiKey || "");
                                      setCopiedPass(true);
                                      setTimeout(() => setCopiedPass(false), 2000);
                                    }}
                                  >
                                    {copiedPass ? "Copied!" : "Copy"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          <Button
                            className="w-full bg-teal-600 hover:bg-teal-750 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-2 h-9 text-xs"
                            onClick={() => {
                              window.open(
                                "https://digital.waaree.com/",
                                "_blank"
                              );
                            }}
                          >
                            Launch Waaree Digital Portal
                          </Button>
                        </div>
                      )}

                      {/* Simulation active banner */}
                      {selectedConnectionType === "Simulation" && (
                        <div className="mt-3 p-4 rounded-xl bg-amber-50 border border-amber-200/60 space-y-2 shadow-sm">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                              <Zap className="h-4 w-4 text-amber-600 shrink-0" />
                              Simulation Active ({selectedBrand})
                            </p>
                            <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[9px] px-2 py-0.5 rounded font-bold">Simulated Sync</Badge>
                          </div>
                          <p className="text-xs text-amber-700 leading-relaxed">
                            This client is configured to run in high-fidelity simulation mode. Generation telemetry is calculated based on system size of {selectedCustomer.systemSizeKw || 5} kW.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                      Inverter credentials are not configured or no telemetry metrics are available yet. Click Update Credentials to start.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bottom Generation History Chart */}
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-800">Inverter Generation History</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Historical solar generation yield chart over time.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(["realtime", "daily", "monthly", "yearly"] as const).map((period) => (
                    <Button
                      key={period}
                      variant={selectedPeriod === period ? "secondary" : "outline"}
                      size="sm"
                      className="min-w-[80px] capitalize text-xs font-bold"
                      onClick={() => setSelectedPeriod(period)}
                    >
                      {period === "realtime" ? "Real-time" : period}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoadingInverterHistory ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">Loading generation history...</span>
                  </div>
                ) : historyErrorMsg ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-xs text-red-700 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                    <div>
                      <p className="font-bold">Historical Data Unavailable</p>
                      <p className="mt-1 leading-relaxed font-semibold">{historyErrorMsg}</p>
                    </div>
                  </div>
                ) : inverterHistory?.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Selected Interval</span>
                        <span className="mt-1 text-sm font-bold text-slate-800 block capitalize">{selectedPeriod === "realtime" ? "Real-time Power" : selectedPeriod}</span>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          {selectedPeriod === "realtime" ? "Latest Output Power" : "Latest Period Yield"}
                        </span>
                        <span className="mt-1 text-sm font-bold text-slate-800 block">
                          {(() => {
                            if (selectedPeriod === "realtime") {
                              const curHour = new Date().getHours();
                              const curPower = (inverterHistory[curHour] as any)?.power ?? (inverterHistory as any[]).find(h => h.power > 0 && h.label === `${String(curHour).padStart(2, '0')}:00`)?.power ?? 0;
                              return `${curPower.toFixed(2)} kW`;
                            }
                            return `${inverterHistory[inverterHistory.length - 1]?.generation?.toFixed(1) ?? 0} kWh`;
                          })()}
                        </span>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Yield Data Points</span>
                        <span className="mt-1 text-sm font-bold text-slate-800 block">{inverterHistory.length} records</span>
                      </div>
                    </div>

                    <div className="h-[260px] pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        {selectedPeriod === "realtime" ? (
                          <AreaChart data={inverterHistory} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="realtimeColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 500 }} minTickGap={15} />
                            <YAxis tick={{ fontSize: 11, fontWeight: 500 }} unit=" kW" />
                            <Tooltip formatter={(value: number) => [`${value} kW`, "Power Output"]} />
                            <Area type="monotone" dataKey="power" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#realtimeColor)" />
                          </AreaChart>
                        ) : (
                          <BarChart data={inverterHistory} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 500 }} minTickGap={15} />
                            <YAxis tick={{ fontSize: 11, fontWeight: 500 }} unit=" kWh" />
                            <Tooltip formatter={(value: number) => [`${value} kWh`, "Energy Generated"]} />
                            <Bar dataKey="generation" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500">
                    No historical yield records are available for this customer yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            <Zap className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700">No Client Selected</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Choose a customer and city filter from the dropdown options above to load solar plant telemetry summaries.
            </p>
          </div>
        )}
      </div>

      <Dialog open={isCredentialModalOpen} onOpenChange={setIsCredentialModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-none shadow-2xl rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Update Inverter Credentials</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Edit inverter login details, location, and metadata for the selected customer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3 pr-1">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Inverter Brand</label>
              <select
                value={modalBrand}
                onChange={(event) => {
                  const val = event.target.value;
                  setModalBrand(val);
                  if (val === "Growatt") {
                    setModalConnectionType("GrowattPortal");
                  } else if (val === "FoxESS" || val === "UTL") {
                    setModalConnectionType("FoxESS");
                  } else if (val === "KSolar") {
                    setModalConnectionType("ShineMonitor");
                  } else if (val === "Solarman") {
                    setModalConnectionType("Solarman");
                  } else if (val === "Waaree") {
                    setModalConnectionType("Waaree");
                  } else {
                    setModalConnectionType("Simulation");
                  }
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 font-medium"
              >
                <option value="">Select Inverter Brand</option>
                <option value="KSolar">KSolar</option>
                <option value="PVBlink">PVBlink</option>
                <option value="UTL">UTL Solar</option>
                <option value="Waaree">Waaree</option>
                <option value="Vsole">Vsole</option>
                <option value="Solarman">Solarman</option>
                <option value="Growatt">Growatt</option>
                <option value="Havells">Havells</option>
                <option value="Anchor">Anchor</option>
              </select>
            </div>

            {modalBrand && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">API Connection Type</label>
                <select
                  value={modalConnectionType}
                  onChange={(event) => setModalConnectionType(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 font-medium"
                >
                  {modalBrand === "KSolar" && (
                    <>
                      <option value="ShineMonitor">ShineMonitor API (Direct Login)</option>
                      <option value="Simulation">Simulation (No API Key)</option>
                    </>
                  )}
                  {modalBrand === "Growatt" && (
                    <>
                      <option value="GrowattPortal">Growatt ShineServer (Direct Login)</option>
                      <option value="Simulation">Simulation (No API Key)</option>
                    </>
                  )}
                  {modalBrand === "UTL" && (
                    <>
                      <option value="FoxESS">FoxESS Cloud API (Direct Login)</option>
                      <option value="Simulation">Simulation (No API Key)</option>
                    </>
                  )}
                  {modalBrand === "Solarman" && (
                    <>
                      <option value="Solarman">Solarman API (Direct Login)</option>
                      <option value="Simulation">Simulation (No API Key)</option>
                    </>
                  )}
                  {modalBrand === "Waaree" && (
                    <>
                      <option value="Waaree">Waaree API (Direct Login / API Key)</option>
                      <option value="Simulation">Simulation (No API Key)</option>
                    </>
                  )}
                  {!["KSolar", "Growatt", "UTL", "Solarman", "Waaree"].includes(modalBrand) && (
                    <>
                      <option value="Simulation">Simulation (No API Key)</option>
                      <option value="Solarman">Solarman API</option>
                      <option value="Solis">SolisCloud API</option>
                      <option value="ShineMonitor">ShineMonitor API</option>
                      <option value="FoxESS">FoxESS Cloud API</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {modalConnectionType !== "Simulation" && (
              <>
                {modalConnectionType !== "Waaree" ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        {modalBrand} Username / Login ID
                      </label>
                      <Input
                        value={credentialDraft.inverterLoginId}
                        onChange={(event) => setCredentialDraft((prev) => ({ ...prev, inverterLoginId: event.target.value }))}
                        placeholder={`Enter ${modalBrand} username`}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        {modalBrand} Password
                      </label>
                      <Input
                        type="password"
                        value={credentialDraft.inverterPassword === "api_token" ? "" : credentialDraft.inverterPassword}
                        onChange={(event) => setCredentialDraft((prev) => ({ ...prev, inverterPassword: event.target.value }))}
                        placeholder="Enter password"
                        className="h-10"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Waaree Token ID
                      </label>
                      <Input
                        value={credentialDraft.inverterApiKey}
                        onChange={(event) => setCredentialDraft((prev) => ({ ...prev, inverterApiKey: event.target.value }))}
                        placeholder="Enter Waaree Solax Token ID"
                        className="font-mono text-sm h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Inverter Serial Number (SN)
                      </label>
                      <Input
                        value={credentialDraft.inverterDeviceSn}
                        onChange={(event) => setCredentialDraft((prev) => ({ ...prev, inverterDeviceSn: event.target.value }))}
                        placeholder="Enter Inverter SN (e.g. SFxxxxxxxx)"
                        className="font-mono text-sm h-10"
                      />
                    </div>
                  </>
                )}

                {["FoxESS", "Solarman", "Solis"].includes(modalConnectionType) && (
                  <div className="mt-2 border-t border-slate-100 pt-3 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Advanced API Settings (Optional)
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">API Key / App ID</label>
                        <Input
                          value={credentialDraft.inverterApiKey}
                          onChange={(event) => setCredentialDraft((prev) => ({ ...prev, inverterApiKey: event.target.value }))}
                          placeholder="API Key / App ID"
                          className="font-mono text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Device SN / Station ID</label>
                        <Input
                          value={credentialDraft.inverterDeviceSn}
                          onChange={(event) => setCredentialDraft((prev) => ({ ...prev, inverterDeviceSn: event.target.value }))}
                          placeholder="Device SN / Station ID"
                          className="font-mono text-xs h-9"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {modalConnectionType === "Simulation" && (
              <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs leading-relaxed flex items-start gap-2">
                <Zap className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Telemetry Simulation Enabled:</strong> This inverter will run in high-fidelity simulation mode. No API credentials are required. The dashboard will automatically simulate live generation data based on the client's installed capacity.
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">City</label>
              <Input
                value={credentialDraft.city}
                onChange={(event) => setCredentialDraft((prev) => ({ ...prev, city: event.target.value }))}
                placeholder="City"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Address</label>
              <Input
                value={credentialDraft.address}
                onChange={(event) => setCredentialDraft((prev) => ({ ...prev, address: event.target.value }))}
                placeholder="Address"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Project Stage (1-10)</label>
              <Input
                type="number"
                value={credentialDraft.projectStage}
                onChange={(event) => setCredentialDraft((prev) => ({ ...prev, projectStage: event.target.value }))}
                placeholder="Project stage"
                className="h-10"
              />
            </div>
            {credentialError ? (
              <div className="rounded-lg bg-rose-50 px-4 py-3 text-xs text-rose-700 font-medium">{credentialError}</div>
            ) : null}
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" className="h-10 text-xs font-bold" onClick={() => setIsCredentialModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="h-10 text-xs font-bold"
              onClick={() => {
                if (!selectedCustomer) return;
                updateCredentialsMutation.mutate({
                  id: selectedCustomer.id,
                  data: {
                    inverterBrand: (() => {
                      if (modalBrand === "KSolar" && modalConnectionType === "ShineMonitor") return "KSolar";
                      if (modalBrand === "Growatt" && modalConnectionType === "Growatt") return "Growatt";
                      if (modalBrand === "Growatt" && modalConnectionType === "GrowattPortal") return "Growatt (GrowattPortal)";
                      if (modalBrand === "UTL" && modalConnectionType === "FoxESS") return "UTL";
                      if (modalBrand === "Solarman" && modalConnectionType === "Solarman") return "Solarman";
                      if (!["KSolar", "Growatt", "UTL", "Solarman"].includes(modalBrand) && modalConnectionType === "Simulation") return modalBrand;
                      return `${modalBrand} (${modalConnectionType})`;
                    })(),
                    inverterLoginId: credentialDraft.inverterLoginId || undefined,
                    inverterPassword: credentialDraft.inverterPassword || undefined,
                    inverterApiKey: credentialDraft.inverterApiKey || undefined,
                    inverterDeviceSn: credentialDraft.inverterDeviceSn || undefined,
                    city: credentialDraft.city || undefined,
                    address: credentialDraft.address || undefined,
                    projectStage: credentialDraft.projectStage ? Number(credentialDraft.projectStage) : undefined,
                  },
                });
              }}
              disabled={isSavingCredentials}
            >
              {isSavingCredentials ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
