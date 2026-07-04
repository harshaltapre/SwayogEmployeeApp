import { Search, Plus, MapPin, Phone, Mail, Zap, Download, LayoutGrid, List, ChevronRight, IndianRupee, Shield, Copy, Check, Upload, Building2, User, Loader2 } from "lucide-react";
import { C, Pill, StatCard, Card } from "./shared";
import { useListCustomers, useListApartments, useCreateApartment } from "@/lib/api-client";
import { useState, Fragment, useEffect } from "react";
import { format } from "date-fns";
import { CustomerDetailContent } from "@/components/customers/CustomerDetailContent";
import { CustomerFormModal } from "./CustomerFormModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import { useBulkCustomerImport } from "@/hooks/use-bulk-import";
import { exportCustomersToExcel } from "@/lib/excel-parser";
 
export default function CustomersTab() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: customers, isLoading, refetch } = useListCustomers({ search: debouncedSearch || undefined });
  const { data: apartments, isLoading: isApartmentsLoading, refetch: refetchApartments } = useListApartments();
  const createApartmentMutation = useCreateApartment();

  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ loginId: string; password?: string; email?: string } | null>(null);
  const [copiedCredField, setCopiedCredField] = useState<"loginId" | "password" | null>(null);
  const { toast } = useToast();

  const [isChoiceDialogOpen, setIsChoiceDialogOpen] = useState(false);
  const [isAddManuallyChoiceDialogOpen, setIsAddManuallyChoiceDialogOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isApartmentFlowOpen, setIsApartmentFlowOpen] = useState(false);
  const [apartmentFlowStep, setApartmentFlowStep] = useState<"search" | "new" | "review" | "select" | "create" | "details">("search");
  const [apartmentSearch, setApartmentSearch] = useState("");
  const [selectedApartment, setSelectedApartment] = useState<any | null>(null);
  const [newApartmentName, setNewApartmentName] = useState("");
  const [newApartmentAddress, setNewApartmentAddress] = useState("");
  const [newApartmentCity, setNewApartmentCity] = useState("");
  const [targetApartmentId, setTargetApartmentId] = useState<number | null>(null);
  const [targetApartmentAddress, setTargetApartmentAddress] = useState("");
  const [targetApartmentCity, setTargetApartmentCity] = useState("");

  const bulkCustomerImport = useBulkCustomerImport();

  const handleExcelImport = async (validatedData: any[]) => {
    const res = await bulkCustomerImport.mutateAsync(validatedData);
    refetch();
    return res;
  };

  const handleCopyCreatedCredential = async (field: "loginId" | "password") => {
    const value = createdCreds?.[field];
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopiedCredField(field);
    toast({
      title: "Copied",
      description: `${field === "loginId" ? "Login ID" : "Password"} copied to clipboard.`,
    });
    setTimeout(() => setCopiedCredField((current) => (current === field ? null : current)), 2000);
  };

  if (selectedCustomerId) {
    return (
      <CustomerDetailContent 
        id={selectedCustomerId} 
        onBack={() => setSelectedCustomerId(null)} 
        hideHeader
      />
    );
  }

  const filtered = Array.isArray(customers) ? customers : [];

  const totalKw = Array.isArray(customers) ? customers.reduce((s, c) => s + (Number(c.systemSizeKw) || 0), 0) : 0;
  const totalProjectValue = totalKw * 60000;
  const formattedProjectValue = totalProjectValue >= 100000 
    ? `₹${(totalProjectValue / 100000).toFixed(1)}L`
    : `₹${(totalProjectValue / 1000).toFixed(1)}k`;
  const activeAmc = Array.isArray(customers) ? customers.filter((c: any) => String(c.amcStatus || "").toLowerCase() === "active").length : 0;

  const handleAddCustomerToApartment = (apt: any) => {
    setTargetApartmentId(apt.id);
    setTargetApartmentAddress(apt.address);
    setTargetApartmentCity(apt.city);
    setIsAddModalOpen(true);
  };

  const individualCustomers = filtered.filter(c => !c.apartmentId);

  const apartmentsToDisplay = (apartments || []).filter(apt => {
    const hasFilteredCustomers = filtered.some(c => c.apartmentId === apt.id);
    if (hasFilteredCustomers) return true;
    if (search.trim() !== "") {
      const matchName = apt.name.toLowerCase().includes(search.toLowerCase());
      const matchAddress = apt.address.toLowerCase().includes(search.toLowerCase());
      return matchName || matchAddress;
    }
    return true;
  });

  const showIndividualHeader = individualCustomers.length > 0 && apartmentsToDisplay.length > 0;

  const renderCustomerRow = (c: any, isNested: boolean = false) => {
    return (
      <tr 
        key={c.id} 
        style={{ 
          borderBottom: "1px solid #F1F5F9", 
          background: isNested ? "#FAF9FF" : "#fff",
          borderLeft: isNested ? "4px solid #6366F1" : "none"
        }}
      >
        <td style={{ padding: "16px 24px", paddingLeft: isNested ? 36 : 24 }}>
           <div style={{ fontWeight: 800, color: C.ink }}>{c.name}</div>
           <div style={{ fontSize: 11, color: C.slate, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
             {c.apartment ? (
               <>
                 <Building2 size={11} className="text-indigo-500" />
                 <span>{c.city} • <span className="font-semibold text-indigo-600">{c.apartment.name}</span></span>
               </>
             ) : (
               <span>{c.city}</span>
             )}
           </div>
        </td>
        <td style={{ padding: "16px 24px" }}>
           <div style={{ fontSize: 13, fontWeight: 600 }}>{c.phone}</div>
           <div style={{ fontSize: 11, color: C.slate }}>{c.email}</div>
        </td>
        <td style={{ padding: "16px 24px" }}>
           <div style={{ fontSize: 13, fontWeight: 600 }}>
             {c.installationDate && !isNaN(new Date(c.installationDate).getTime()) 
               ? format(new Date(c.installationDate), "dd MMM yyyy") 
               : "N/A"}
           </div>
        </td>
        <td style={{ padding: "16px 24px" }}>
           <div style={{ fontSize: 13, fontWeight: 700 }}>{c.projectStage !== undefined && c.projectStage >= 0 ? `Stage ${c.projectStage + 1}` : "Not started"}</div>
           <div style={{ fontSize: 11, color: C.slate }}>{c.projectStage !== undefined && c.projectStage >= 0 ? `Stage ${c.projectStage + 1} of 12` : "No stage"}</div>
        </td>
        <td style={{ padding: "16px 24px" }}>
           <div style={{ fontSize: 13, fontWeight: 800, color: C.amber }}>{c.systemSizeKw} kW</div>
        </td>
        <td style={{ padding: "16px 24px" }}>
           <Pill text={c.amcStatus.toUpperCase()} variant={c.amcStatus === "active" ? "green" : "gray"} />
        </td>
        <td style={{ padding: "16px 24px" }}>
           <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
             {c.cleaningsPerMonth ? `${c.cleaningsPerMonth} / Mo` : "—"}
           </div>
        </td>
        <td style={{ padding: "16px 24px" }}>
           <button onClick={() => setSelectedCustomerId(c.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>View</button>
        </td>
      </tr>
    );
  };

  const renderApartmentHeaderRow = (apt: any, count: number) => {
    return (
      <tr key={`apt-hdr-${apt.id}`} style={{ background: "#EEF2F6", borderBottom: "1px solid #E2E8F0" }}>
        <td colSpan={8} style={{ padding: "12px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "#6366F118", borderRadius: 8, padding: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Building2 size={16} className="text-indigo-600" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: C.ink, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{apt.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: "#6366F122", color: "#6366F1", padding: "2px 8px", borderRadius: 12 }}>
                    {count} {count === 1 ? "Customer" : "Customers"}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: C.slate, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={10} />
                  <span>{apt.address}, {apt.city}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => handleAddCustomerToApartment(apt)}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 6, 
                fontSize: 11, 
                color: "#fff", 
                background: C.gold, 
                border: "none", 
                borderRadius: 6, 
                padding: "6px 12px", 
                cursor: "pointer", 
                fontWeight: 700 
              }}
            >
              <Plus size={12} /> Add Customer
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderApartmentEmptyRow = (apt: any) => {
    return (
      <tr key={`apt-empty-${apt.id}`} style={{ borderBottom: "1px solid #F1F5F9", background: "#FAF9FF", borderLeft: "4px solid #6366F1" }}>
        <td colSpan={8} style={{ padding: "20px 24px", textAlign: "center", color: C.slate, fontSize: 12, fontStyle: "italic" }}>
          No customers in this building yet. Click "+ Add Customer" on the right to add one.
        </td>
      </tr>
    );
  };

  const renderCustomerCard = (c: any) => {
    return (
      <div key={c.id} style={{ borderRadius: 20, border: "1px solid #E2E8F0", overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ background: C.ink, padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{c.name}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
              <MapPin size={11} /> {c.city}
              {c.apartment && (
                <>
                  <span>•</span>
                  <Building2 size={11} />
                  <span style={{ color: "#fff", fontWeight: 600 }}>{c.apartment.name}</span>
                </>
              )}
            </div>
          </div>
          <Pill text={c.amcStatus.toUpperCase()} variant={c.amcStatus === "active" ? "green" : "yellow"} />
        </div>
        <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, textTransform: "uppercase" }}>Phone</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{c.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.slate, fontWeight: 700, textTransform: "uppercase" }}>System</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <Zap size={12} color={C.amber} /> {c.systemSizeKw} kW
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, marginBottom: 6 }}>Current Stage</div>
              <div style={{ padding: "10px 12px", borderRadius: 12, background: "#F8FAFC", color: C.ink, fontSize: 12, fontWeight: 700 }}>
                {c.projectStage !== undefined && c.projectStage >= 0 ? `Stage ${c.projectStage + 1} of 12` : "Not started"}
              </div>
            </div>
          </div>

          <button 
            onClick={() => setSelectedCustomerId(c.id)}
            style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontWeight: 800, fontSize: 12, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            View Details <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <CustomerFormModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        apartmentId={targetApartmentId}
        defaultAddress={targetApartmentAddress}
        defaultCity={targetApartmentCity}
        onSuccess={(creds) => {
          toast({ title: "Customer created", description: "Customer account created successfully. Share the login details with them." });
          setCreatedCreds(creds);
          refetch();
          refetchApartments();
        }}
      />

      <Dialog open={isChoiceDialogOpen} onOpenChange={setIsChoiceDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>
              Choose whether to add a single customer manually or upload multiple customers in bulk using an Excel file.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-28 gap-2 border-slate-200 hover:border-slate-350 hover:bg-slate-50 transition-all cursor-pointer"
              onClick={() => {
                setIsChoiceDialogOpen(false);
                setIsAddManuallyChoiceDialogOpen(true);
              }}
            >
              <Plus className="h-6 w-6 text-amber-500" />
              <span className="font-semibold text-xs">Add Manually</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-28 gap-2 border-slate-200 hover:border-slate-350 hover:bg-slate-50 transition-all cursor-pointer"
              onClick={() => {
                setIsChoiceDialogOpen(false);
                setIsExcelImportOpen(true);
              }}
            >
              <Upload className="h-6 w-6 text-emerald-500" />
              <span className="font-semibold text-xs">Import from Excel</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddManuallyChoiceDialogOpen} onOpenChange={setIsAddManuallyChoiceDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add Customer Manually</DialogTitle>
            <DialogDescription>
              Choose whether to add an individual customer or a customer residing in an apartment building.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-28 gap-2 border-slate-200 hover:border-slate-350 hover:bg-slate-50 transition-all cursor-pointer"
              onClick={() => {
                setIsAddManuallyChoiceDialogOpen(false);
                setTargetApartmentId(null);
                setTargetApartmentAddress("");
                setTargetApartmentCity("");
                setIsAddModalOpen(true);
              }}
            >
              <User className="h-6 w-6 text-amber-500" />
              <span className="font-semibold text-xs">Individual</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-28 gap-2 border-slate-200 hover:border-slate-350 hover:bg-slate-50 transition-all cursor-pointer"
              onClick={() => {
                setIsAddManuallyChoiceDialogOpen(false);
                setApartmentFlowStep("select");
                setIsApartmentFlowOpen(true);
              }}
            >
              <Building2 className="h-6 w-6 text-indigo-500" />
              <span className="font-semibold text-xs">Apartment Building</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isApartmentFlowOpen} onOpenChange={setIsApartmentFlowOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          {apartmentFlowStep === "select" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-indigo-600 font-extrabold">
                  <Building2 className="h-5 w-5" /> Select Apartment Building
                </DialogTitle>
                <DialogDescription>
                  Select an existing building to add a customer to it, or create a new one.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by building name or address..."
                    value={apartmentSearch}
                    onChange={(e) => setApartmentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-indigo-500 transition-all"
                  />
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-2 border border-slate-100 rounded-lg p-1 bg-slate-50/50">
                  {isApartmentsLoading ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-slate-500 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> Loading buildings...
                    </div>
                  ) : apartments && apartments.length > 0 ? (
                    apartments
                      .filter((apt) =>
                        apt.name.toLowerCase().includes(apartmentSearch.toLowerCase()) ||
                        apt.address.toLowerCase().includes(apartmentSearch.toLowerCase())
                      )
                      .map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => {
                            setSelectedApartment(apt);
                            setApartmentFlowStep("details");
                          }}
                          className="flex justify-between items-center p-3 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all"
                        >
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{apt.name}</div>
                            <div className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-slate-400" /> {apt.address}, {apt.city}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
                              {Array.isArray(customers) ? customers.filter((c: any) => c.apartmentId === apt.id).length : 0} Customers
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">No buildings created yet.</div>
                  )}
                </div>

                <Button
                  onClick={() => {
                    setNewApartmentName("");
                    setNewApartmentAddress("");
                    setNewApartmentCity("Pune");
                    setApartmentFlowStep("create");
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 shadow-none py-2 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Create New Apartment Building
                </Button>
              </div>
            </>
          )}

          {apartmentFlowStep === "create" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-indigo-600 font-extrabold">
                  <Building2 className="h-5 w-5" /> New Apartment Building
                </DialogTitle>
                <DialogDescription>
                  Enter the details to create a new apartment building record.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Building Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Green Glen Apartments"
                    value={newApartmentName}
                    onChange={(e) => setNewApartmentName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Address</label>
                  <input
                    type="text"
                    placeholder="Street, area name, landmark"
                    value={newApartmentAddress}
                    onChange={(e) => setNewApartmentAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune"
                    value={newApartmentCity}
                    onChange={(e) => setNewApartmentCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-indigo-500"
                  />
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setApartmentFlowStep("select")} disabled={createApartmentMutation.isPending} className="cursor-pointer">
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!newApartmentName.trim() || !newApartmentAddress.trim()) {
                      toast({ title: "Validation Error", description: "Name and Address are required.", variant: "destructive" });
                      return;
                    }
                    try {
                      const apt = (await createApartmentMutation.mutateAsync({
                        data: {
                          name: newApartmentName,
                          address: newApartmentAddress,
                          city: newApartmentCity,
                        },
                      })) as any;
                      toast({ title: "Created", description: `Building "${apt.name}" created successfully.` });
                      refetchApartments();
                      setSelectedApartment(apt);
                      setApartmentFlowStep("details");
                    } catch (e: any) {
                      toast({ title: "Failed to create building", description: e?.error || "An error occurred.", variant: "destructive" });
                    }
                  }}
                  disabled={createApartmentMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  {createApartmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create & Continue
                </Button>
              </DialogFooter>
            </>
          )}

          {apartmentFlowStep === "details" && selectedApartment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-indigo-600 font-extrabold flex items-center justify-between">
                  <span>{selectedApartment.name}</span>
                  <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
                    Active Building
                  </span>
                </DialogTitle>
                <DialogDescription className="flex items-center gap-1 text-slate-500 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> {selectedApartment.address}, {selectedApartment.city}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                <div>
                  <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-2">Customers in this Building</h4>
                  <div className="max-h-[220px] overflow-y-auto space-y-2 border border-slate-100 rounded-lg p-1 bg-slate-50/50">
                    {(() => {
                      const list = Array.isArray(customers)
                        ? customers.filter((c: any) => c.apartmentId === selectedApartment.id)
                        : [];
                      if (list.length === 0) {
                        return <div className="text-center py-8 text-slate-400 text-sm">No customers added to this building yet.</div>;
                      }
                      return list.map((c: any) => (
                        <div key={c.id} className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{c.email} • {c.phone}</div>
                          </div>
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            c.amcStatus === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-500 border border-slate-100"
                          }`}>
                            {c.amcStatus}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="w-1/3 cursor-pointer" onClick={() => setApartmentFlowStep("select")}>
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      setTargetApartmentId(selectedApartment.id);
                      setTargetApartmentAddress(selectedApartment.address);
                      setTargetApartmentCity(selectedApartment.city);
                      setIsApartmentFlowOpen(false);
                      setIsAddModalOpen(true);
                    }}
                    className="w-2/3 bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1.5 font-bold cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Customer here
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ExcelImportDialog
        open={isExcelImportOpen}
        onOpenChange={setIsExcelImportOpen}
        onImport={handleExcelImport}
        importType="customer"
        title="Import Customers from Excel"
        description="Upload an Excel file with customer details. Make sure you use the standard template structure."
      />

      <Dialog open={!!createdCreds} onOpenChange={() => setCreatedCreds(null)}>
        <DialogContent onInteractOutside={(event) => event.preventDefault()} onEscapeKeyDown={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Customer Created Successfully</DialogTitle>
            <DialogDescription>Please share these credentials with the customer. They will not be shown again.</DialogDescription>
          </DialogHeader>
          <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0", marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: C.slate }}>Login ID:</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>{createdCreds?.loginId}</span>
                <button
                  type="button"
                  onClick={() => void handleCopyCreatedCredential("loginId")}
                  style={{ border: "1px solid #E2E8F0", background: "#fff", borderRadius: 8, width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  aria-label="Copy login ID"
                >
                  {copiedCredField === "loginId" ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: C.slate }}>Password:</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>Hidden for security</span>
                <button
                  type="button"
                  onClick={async () => {
                    const email = createdCreds?.email;
                    if (!email) return;
                    try {
                      await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
                      toast({ title: 'Reset sent', description: 'Password reset email has been sent to the customer.' });
                    } catch (e) {
                      toast({ title: 'Failed', description: 'Could not send reset email', variant: 'destructive' });
                    }
                  }}
                  style={{ border: "1px solid #E2E8F0", background: "#fff", borderRadius: 8, width: 110, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                >
                  Send reset email
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedCreds(null)} className="w-full">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard title="Total Customers" value={isLoading ? "..." : (customers?.length || 0).toString()} icon={<Zap size={20} color={C.amber} />} accent={C.amber} />
          <StatCard title="Total Capacity"  value={isLoading ? "..." : `${totalKw.toFixed(1)} kW`} icon={<Zap size={20} color={C.sky} />} sub="Solar installation base" accent={C.sky} />
          <StatCard title="Active AMC"      value={isLoading ? "..." : activeAmc.toString()} icon={<Shield size={20} color={C.emerald} />} accent={C.emerald} />
          <StatCard title="Project Value"   value={isLoading ? "..." : formattedProjectValue} icon={<IndianRupee size={20} color={C.rose} />} sub="Est. revenue" accent={C.rose} />
        </div>

        <Card>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>Customer Directory</span>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.slate }} />
                <input 
                  placeholder="Search name, phone..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: "6px 10px 6px 32px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, width: 220, background: "#F8FAFC" }}
                />
              </div>
              <div style={{ display: "flex", background: "#F1F5F9", padding: 3, borderRadius: 10, gap: 2 }}>
                <button 
                  type="button"
                  onClick={() => setViewMode("grid")} 
                  aria-pressed={viewMode === "grid"}
                  style={{ 
                    border: "none", background: viewMode === "grid" ? "#fff" : "transparent", 
                    boxShadow: viewMode === "grid" ? "0 2px 8px rgba(0,0,0,0.05)" : "none", 
                    padding: "8px 16px", borderRadius: 10, cursor: "pointer", 
                    display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, 
                    color: viewMode === "grid" ? C.ink : C.slate, transition: "all 0.2s" 
                  }}
                >
                  <LayoutGrid size={14} /> Grid
                </button>
                <button 
                  type="button"
                  onClick={() => setViewMode("table")} 
                  aria-pressed={viewMode === "table"}
                  style={{ 
                    border: "none", background: viewMode === "table" ? "#fff" : "transparent", 
                    boxShadow: viewMode === "table" ? "0 2px 8px rgba(0,0,0,0.05)" : "none", 
                    padding: "8px 16px", borderRadius: 10, cursor: "pointer", 
                    display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, 
                    color: viewMode === "table" ? C.ink : C.slate, transition: "all 0.2s" 
                  }}
                >
                  <List size={14} /> Table
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button 
                onClick={() => setIsChoiceDialogOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#fff", background: C.gold, border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700 }}
              >
                <Plus size={14} /> New Customer
              </button>
              <button 
                onClick={async () => {
                  if (!customers || customers.length === 0) {
                    toast({ title: "No data", description: "No customers to export.", variant: "destructive" });
                    return;
                  }
                  try {
                    const blob = await exportCustomersToExcel(customers);
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.setAttribute("download", `superadmin_customers_${new Date().toISOString().split('T')[0]}.xlsx`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast({ title: "Exported", description: "Customer directory exported to Excel successfully." });
                  } catch (error) {
                    toast({ title: "Export failed", description: "Could not export to Excel.", variant: "destructive" });
                  }
                }}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.slate, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700 }}
              >
                <Download size={14} /> Download
              </button>
            </div>
          </div>

        {viewMode === "grid" ? (
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} style={{ height: 260, background: "#F8FAFC", borderRadius: 20, border: "1px dashed #E2E8F0" }} />)
            ) : filtered?.length === 0 ? (
               <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: C.slate }}>No customers found.</div>
            ) : (
              <>
                {/* 1. Render Individual Customers */}
                {showIndividualHeader && (
                  <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 12, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8, borderBottom: "1px solid #E2E8F0", paddingBottom: 8 }}>
                    <User size={14} className="text-slate-500" />
                    <span>Individual / Unlinked Customers ({individualCustomers.length})</span>
                  </div>
                )}
                {individualCustomers.map(c => renderCustomerCard(c))}

                {/* 2. Render Apartments */}
                {apartmentsToDisplay.map(apt => {
                  const aptCustomers = filtered.filter(c => c.apartmentId === apt.id);
                  return (
                    <Fragment key={apt.id}>
                      {/* Apartment Banner */}
                      <div 
                        style={{ 
                          gridColumn: "1 / -1", 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center", 
                          padding: "12px 20px", 
                          background: "#EEF2F6", 
                          borderRadius: 14, 
                          borderLeft: "4px solid #6366F1", 
                          marginTop: 24 
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ background: "#6366F118", borderRadius: 8, padding: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Building2 size={16} className="text-indigo-600" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 14, color: C.ink, display: "flex", alignItems: "center", gap: 8 }}>
                              <span>{apt.name}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: "#6366F122", color: "#6366F1", padding: "2px 8px", borderRadius: 12 }}>
                                {aptCustomers.length} {aptCustomers.length === 1 ? "Customer" : "Customers"}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: C.slate, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                              <MapPin size={10} />
                              <span>{apt.address}, {apt.city}</span>
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleAddCustomerToApartment(apt)}
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 6, 
                            fontSize: 11, 
                            color: "#fff", 
                            background: C.gold, 
                            border: "none", 
                            borderRadius: 6, 
                            padding: "6px 12px", 
                            cursor: "pointer", 
                            fontWeight: 700 
                          }}
                        >
                          <Plus size={12} /> Add Customer
                        </button>
                      </div>

                      {aptCustomers.length > 0 ? (
                        aptCustomers.map(c => renderCustomerCard(c))
                      ) : (
                        <div 
                          style={{ 
                            gridColumn: "1 / -1", 
                            textAlign: "center", 
                            padding: "24px", 
                            color: C.slate, 
                            fontSize: 12, 
                            background: "#FAF9FF", 
                            borderRadius: 14, 
                            border: "1.5px dashed #6366F133", 
                            fontStyle: "italic" 
                          }}
                        >
                          No customers in this building yet. Click "+ Add Customer" on the right to add one.
                        </div>
                      )}
                    </Fragment>
                  );
                })}
              </>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <tr>
                  {["Name", "Contact", "Installation", "Stage", "System", "AMC Status", "Cleanings", "Actions"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: C.slate }}>Loading customers...</td></tr>
                ) : filtered?.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: C.slate }}>No customers found.</td></tr>
                ) : (
                  <>
                    {/* 1. Render Individual Customers */}
                    {showIndividualHeader && (
                      <tr style={{ background: "#F1F5F9", borderBottom: "1px solid #E2E8F0" }}>
                        <td colSpan={8} style={{ padding: "10px 24px", fontWeight: 800, fontSize: 11, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <User size={13} className="text-slate-500" />
                            <span>Individual / Unlinked Customers ({individualCustomers.length})</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {individualCustomers.map(c => renderCustomerRow(c, false))}

                    {/* 2. Render Apartments */}
                    {apartmentsToDisplay.map(apt => {
                      const aptCustomers = filtered.filter(c => c.apartmentId === apt.id);
                      return (
                        <Fragment key={apt.id}>
                          {renderApartmentHeaderRow(apt, aptCustomers.length)}
                          {aptCustomers.length > 0 ? (
                            aptCustomers.map(c => renderCustomerRow(c, true))
                          ) : (
                            renderApartmentEmptyRow(apt)
                          )}
                        </Fragment>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
        </Card>
      </div>
    </>
  );
}
