import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { 
  useListCustomers, 
  useListInventory, 
  useCreateDispatchRecord, 
  useListDispatchedMaterials,
  useUpdateDispatchRecord,
  useDeleteDispatchRecord,
  useListApartments,
  type CustomerRecord,
  type InventoryRecord,
  type DispatchedMaterialRecord
} from "@/lib/api-client";
import { Redirect } from "wouter";
import { useAuth, isInventoryExecutiveJobRole } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Package, 
  Plus, 
  Minus,
  History, 
  MapPin, 
  Phone, 
  Mail, 
  Loader2, 
  ArrowRightLeft,
  CheckCircle2,
  Calendar,
  RotateCcw,
  Edit2,
  Trash2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Download,
  X,
  Check,
  Boxes,
  Layers,
  Filter,
  Building2
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function InventoryCustomers() {
  const { user } = useAuth();
  if (!user) return null;
  const isSuperOrAdmin = user.role === "super_admin" || user.role === "admin";
  const isExec = isInventoryExecutiveJobRole(user.jobRole);
  if (!isSuperOrAdmin && !isExec) {
    return <Redirect to="/employee/dashboard" />;
  }

  const canManage = isExec;

  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<DispatchedMaterialRecord | null>(null);
  
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [dispatchQuantities, setDispatchQuantities] = useState<Record<string, number>>({});
  const [dispatchDate, setDispatchDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [modalSearch, setModalSearch] = useState("");
  const [modalCategoryFilter, setModalCategoryFilter] = useState("all");
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const [editForm, setEditForm] = useState({
    quantity: 1,
    notes: ""
  });

  const { toast } = useToast();
  const { data: customers, isLoading: isLoadingCustomers } = useListCustomers({ search: search || undefined });
  const { data: inventory } = useListInventory();
  const { data: allDispatches } = useListDispatchedMaterials();
  const { data: apartments } = useListApartments();

  // Group customers: individual (no apartment) vs apartment-grouped
  const individualCustomers = (customers || []).filter(c => !c.apartmentId);
  const apartmentsToDisplay = (apartments || []).filter(apt => {
    return (customers || []).some(c => c.apartmentId === apt.id);
  });

  const createDispatch = useCreateDispatchRecord();
  const updateDispatch = useUpdateDispatchRecord();
  const deleteDispatch = useDeleteDispatchRecord();

  const handleOpenDispatch = (customer: CustomerRecord) => {
    setSelectedCustomer(customer);
    setDispatchQuantities({});
    setDispatchDate(format(new Date(), "yyyy-MM-dd"));
    setDispatchNotes("");
    setModalSearch("");
    setModalCategoryFilter("all");
    setShowOnlySelected(false);
    setIsDispatchModalOpen(true);
  };

  const handleOpenHistory = (customer: CustomerRecord) => {
    setSelectedCustomer(customer);
    setIsHistoryModalOpen(true);
  };

  const handleOpenEdit = (record: DispatchedMaterialRecord) => {
    setSelectedRecord(record);
    setEditForm({
      quantity: record.quantity,
      notes: record.notes || ""
    });
    setIsEditModalOpen(true);
  };

  const handleQuantityChange = (itemId: string | number, qty: number, maxStock: number) => {
    const validQty = Math.max(0, Math.min(maxStock, isNaN(qty) ? 0 : qty));
    setDispatchQuantities(prev => {
      const updated = { ...prev };
      if (validQty <= 0) {
        delete updated[String(itemId)];
      } else {
        updated[String(itemId)] = validQty;
      }
      return updated;
    });
  };

  const handleIncrement = (itemId: string | number, maxStock: number, delta: number = 1) => {
    const current = dispatchQuantities[String(itemId)] || 0;
    handleQuantityChange(itemId, current + delta, maxStock);
  };

  const handleResetQuantities = () => {
    setDispatchQuantities({});
  };

  const onConfirmMultiDispatch = async () => {
    if (!selectedCustomer) return;
    
    const selectedEntries = Object.entries(dispatchQuantities).filter(([_, qty]) => qty > 0);
    if (selectedEntries.length === 0) {
      toast({ 
        title: "No components selected", 
        description: "Please enter a dispatch quantity for at least one component.", 
        variant: "destructive" 
      });
      return;
    }

    // Validate stock
    for (const [itemIdStr, qty] of selectedEntries) {
      const item = inventory?.find(i => String(i.id) === itemIdStr);
      if (item && qty > item.inStock) {
        toast({
          title: "Insufficient Stock",
          description: `Requested quantity (${qty}) for "${item.name}" exceeds available stock (${item.inStock}).`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      let dispatchedCount = 0;
      let totalUnits = 0;

      for (const [itemIdStr, qty] of selectedEntries) {
        const item = inventory?.find(i => String(i.id) === itemIdStr);
        if (!item) continue;

        await createDispatch.mutateAsync({
          data: {
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            itemId: item.id,
            itemName: item.name,
            quantity: qty,
            notes: dispatchNotes || undefined,
            dispatchedAt: dispatchDate ? new Date(dispatchDate).toISOString() : new Date().toISOString()
          }
        });
        dispatchedCount++;
        totalUnits += qty;
      }
      
      toast({ 
        title: "Dispatch Successful", 
        description: `${dispatchedCount} component${dispatchedCount > 1 ? "s" : ""} (${totalUnits} units total) dispatched to ${selectedCustomer.name}.` 
      });
      setIsDispatchModalOpen(false);
      setDispatchQuantities({});
    } catch (err: any) {
      toast({ 
        title: "Dispatch Failed", 
        description: err?.message || "Something went wrong during dispatch.", 
        variant: "destructive" 
      });
    }
  };

  const onConfirmEdit = () => {
    if (!selectedRecord || editForm.quantity <= 0) return;
    updateDispatch.mutate({
      id: selectedRecord.id,
      data: {
        quantity: editForm.quantity,
        notes: editForm.notes
      }
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Dispatch record updated." });
        setIsEditModalOpen(false);
      }
    });
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm("Return this material to stock?")) {
      deleteDispatch.mutate({ id }, {
        onSuccess: () => toast({ title: "Returned", description: "Stock updated." })
      });
    }
  };

  const handleExportDispatches = () => {
    if (!allDispatches || allDispatches.length === 0) {
      toast({ title: "No data", description: "There are no dispatch records to export.", variant: "destructive" });
      return;
    }
    const headers = ["Dispatch Date", "Customer Name", "Item Name", "Quantity", "Notes"];
    const rows = allDispatches.map(d => [
      `"${format(new Date(d.dispatchedAt), "yyyy-MM-dd HH:mm")}"`,
      `"${d.customerName}"`,
      `"${d.itemName}"`,
      d.quantity,
      `"${d.notes || ""}"`
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `dispatch_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Exported", description: "Dispatch history report downloaded." });
  };

  const customerDispatches = allDispatches?.filter(d => d.customerId === selectedCustomer?.id) ?? [];

  return (
    <SidebarLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <PageHeader 
            title="Customer Material Dispatch" 
            description="Manage and track inventory materials dispatched to customer sites."
          />
          <Button 
            variant="outline" 
            className="w-full gap-2 border-slate-200 sm:w-auto"
            onClick={handleExportDispatches}
          >
            <Download size={16} /> Export Dispatch Report
          </Button>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 md:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search customers by name, city, or phone..."
                className="h-11 pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                  <TableHead className="font-semibold text-slate-700">Location</TableHead>
                  <TableHead className="font-semibold text-slate-700">Contact</TableHead>
                  <TableHead className="font-semibold text-slate-700">Dispatch Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingCustomers ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5].map((j) => (
                        <TableCell key={j}><div className="h-4 bg-slate-100 rounded animate-pulse w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : customers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {/* Individual customers (not in any apartment) */}
                    {individualCustomers.length > 0 && apartmentsToDisplay.length > 0 && (
                      <TableRow className="bg-slate-100">
                        <TableCell colSpan={5} className="py-2 px-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <MapPin size={13} className="text-slate-400" />
                            Individual / Unlinked Customers ({individualCustomers.length})
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {individualCustomers.map((customer) => {
                      const customerDispatchesCount = allDispatches?.filter(d => d.customerId === customer.id).length ?? 0;
                      return (
                        <TableRow key={customer.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell>
                            <div className="font-medium text-slate-900">{customer.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5 font-mono">{customer.customerCode || `CUST-${String(customer.id).padStart(4, '0')}`}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-slate-700">
                              <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                              {customer.city}
                            </div>
                            <div className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{customer.address}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-xs text-slate-600">
                              <Phone className="w-3 h-3 mr-1.5 text-slate-400" />
                              {customer.phone}
                            </div>
                            <div className="flex items-center text-xs text-slate-500 mt-1">
                              <Mail className="w-3 h-3 mr-1.5 text-slate-400" />
                              {customer.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {customerDispatchesCount > 0 ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 font-medium">
                                <ArrowRightLeft size={10} /> {customerDispatchesCount} Item{customerDispatchesCount > 1 ? 's' : ''} Dispatched
                              </Badge>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No items dispatched</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {canManage && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 text-xs gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                                  onClick={() => handleOpenHistory(customer)}
                                >
                                  <RotateCcw size={14} /> Return / Edit
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs gap-1.5"
                                onClick={() => handleOpenHistory(customer)}
                              >
                                <History size={14} /> History
                              </Button>
                              {canManage && (
                                <Button 
                                  size="sm" 
                                  className="h-8 text-xs gap-1.5 bg-slate-900 text-white"
                                  onClick={() => handleOpenDispatch(customer)}
                                >
                                  <Plus size={14} /> Add Dispatch
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Apartment-grouped customers */}
                    {apartmentsToDisplay.map((apt) => {
                      const aptCustomers = (customers || []).filter(c => c.apartmentId === apt.id);
                      const aptDispatchCount = aptCustomers.reduce((acc, c) => {
                        return acc + (allDispatches?.filter(d => d.customerId === c.id).length ?? 0);
                      }, 0);
                      return (
                        <>
                          {/* Apartment Header Row */}
                          <TableRow key={`apt-header-${apt.id}`} className="bg-indigo-50 border-l-4 border-l-indigo-500 hover:bg-indigo-50">
                            <TableCell colSpan={5} className="py-3 px-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                                    <Building2 size={15} className="text-indigo-600" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm text-indigo-900">{apt.name}</span>
                                      <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                                        {aptCustomers.length} {aptCustomers.length === 1 ? "Customer" : "Customers"}
                                      </span>
                                      {aptDispatchCount > 0 && (
                                        <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                          {aptDispatchCount} Dispatch{aptDispatchCount > 1 ? "es" : ""}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-indigo-500 mt-0.5">
                                      <MapPin size={10} />
                                      <span>{apt.address}, {apt.city}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Customers in this apartment */}
                          {aptCustomers.length === 0 ? (
                            <TableRow key={`apt-empty-${apt.id}`} className="bg-indigo-50/40">
                              <TableCell colSpan={5} className="py-4 text-center text-xs text-slate-400 italic pl-12">
                                No customers found in this apartment matching your search.
                              </TableCell>
                            </TableRow>
                          ) : (
                            aptCustomers.map((customer) => {
                              const customerDispatchesCount = allDispatches?.filter(d => d.customerId === customer.id).length ?? 0;
                              return (
                                <TableRow key={customer.id} className="hover:bg-indigo-50/30 transition-colors border-l-4 border-l-indigo-200">
                                  <TableCell className="pl-8">
                                    <div className="font-medium text-slate-900">{customer.name}</div>
                                    <div className="text-xs text-slate-500 mt-0.5 font-mono">{customer.customerCode || `CUST-${String(customer.id).padStart(4, '0')}`}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center text-sm text-slate-700">
                                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                      {customer.city}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{customer.address}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center text-xs text-slate-600">
                                      <Phone className="w-3 h-3 mr-1.5 text-slate-400" />
                                      {customer.phone}
                                    </div>
                                    <div className="flex items-center text-xs text-slate-500 mt-1">
                                      <Mail className="w-3 h-3 mr-1.5 text-slate-400" />
                                      {customer.email}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {customerDispatchesCount > 0 ? (
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 font-medium">
                                        <ArrowRightLeft size={10} /> {customerDispatchesCount} Item{customerDispatchesCount > 1 ? 's' : ''} Dispatched
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-slate-400 italic">No items dispatched</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      {canManage && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="h-8 text-xs gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                                          onClick={() => handleOpenHistory(customer)}
                                        >
                                          <RotateCcw size={14} /> Return / Edit
                                        </Button>
                                      )}
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 text-xs gap-1.5"
                                        onClick={() => handleOpenHistory(customer)}
                                      >
                                        <History size={14} /> History
                                      </Button>
                                      {canManage && (
                                        <Button 
                                          size="sm" 
                                          className="h-8 text-xs gap-1.5 bg-slate-900 text-white"
                                          onClick={() => handleOpenDispatch(customer)}
                                        >
                                          <Plus size={14} /> Add Dispatch
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </>
                      );
                    })}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Material Dispatch Modal */}
      <Dialog open={isDispatchModalOpen} onOpenChange={setIsDispatchModalOpen}>
        <DialogContent className="sm:max-w-[860px] w-[96vw] max-h-[92vh] flex flex-col p-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="p-5 pb-4 border-b bg-gradient-to-r from-slate-50 to-blue-50/40">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
                    <Package size={18} />
                  </div>
                  Add Material Dispatch
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-slate-600">
                  Dispatched to: <span className="font-semibold text-slate-900">{selectedCustomer?.name}</span>
                  {selectedCustomer?.customerCode && <span className="font-mono ml-1.5 text-slate-500">({selectedCustomer.customerCode})</span>}
                  {selectedCustomer?.city && <span className="ml-2 text-slate-500">• {selectedCustomer.city}</span>}
                  {selectedCustomer?.apartment && (
                    <span className="ml-2 inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <Building2 size={10} /> {selectedCustomer.apartment.name}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Top Parameters: Date & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <div className="sm:col-span-4 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar size={13} className="text-blue-600" />
                  Dispatch Date <span className="text-rose-500">*</span>
                </label>
                <Input 
                  type="date" 
                  className="bg-white border-slate-200 h-9 text-sm font-medium"
                  value={dispatchDate} 
                  onChange={(e) => setDispatchDate(e.target.value)} 
                />
              </div>
              <div className="sm:col-span-8 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Edit2 size={13} className="text-slate-500" />
                  Dispatch Notes / Reference
                </label>
                <Input 
                  placeholder="e.g. Structure & Earthing materials, Gate Pass #123..." 
                  className="bg-white border-slate-200 h-9 text-sm"
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Filter & Search Bar */}
            {(() => {
              const allCategories = Array.from(new Set(inventory?.map(i => i.category).filter(Boolean) || []));
              const selectedCount = Object.values(dispatchQuantities).filter(q => q > 0).length;
              const totalUnits = Object.values(dispatchQuantities).reduce((acc, q) => acc + (q || 0), 0);

              const filteredItems = (inventory || []).filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(modalSearch.toLowerCase()) || 
                                     item.sku.toLowerCase().includes(modalSearch.toLowerCase()) ||
                                     item.category.toLowerCase().includes(modalSearch.toLowerCase());
                const matchesCategory = modalCategoryFilter === "all" || item.category === modalCategoryFilter;
                const isSelected = (dispatchQuantities[String(item.id)] || 0) > 0;
                
                if (showOnlySelected) {
                  return matchesSearch && matchesCategory && isSelected;
                }
                return matchesSearch && matchesCategory;
              });

              return (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                    {/* Search & Category Filter */}
                    <div className="flex flex-1 items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search component by name, SKU, or category..."
                          className="h-9 pl-8 text-xs sm:text-sm bg-white"
                          value={modalSearch}
                          onChange={(e) => setModalSearch(e.target.value)}
                        />
                        {modalSearch && (
                          <button 
                            onClick={() => setModalSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      <Select value={modalCategoryFilter} onValueChange={setModalCategoryFilter}>
                        <SelectTrigger className="w-[140px] sm:w-[160px] h-9 text-xs bg-white border-slate-200">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {allCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Selected toggle & quick clear */}
                    <div className="flex items-center gap-2 justify-between sm:justify-end">
                      <Button
                        type="button"
                        variant={showOnlySelected ? "default" : "outline"}
                        size="sm"
                        className={`h-9 text-xs gap-1.5 ${showOnlySelected ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-200 text-slate-700"}`}
                        onClick={() => setShowOnlySelected(prev => !prev)}
                      >
                        <Layers size={13} />
                        Selected ({selectedCount})
                      </Button>

                      {selectedCount > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
                          onClick={handleResetQuantities}
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Components List */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                      {filteredItems.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 bg-slate-50/50">
                          <Boxes className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                          <p className="text-sm font-medium">No components found matching your search</p>
                          <p className="text-xs text-slate-400 mt-1">Try clearing your search query or category filter</p>
                        </div>
                      ) : (
                        filteredItems.map((item) => {
                          const qty = dispatchQuantities[String(item.id)] || 0;
                          const isSelected = qty > 0;
                          const isOutOfStock = item.inStock === 0;
                          const isLowStock = !isOutOfStock && item.inStock <= item.minThreshold;

                          return (
                            <div 
                              key={item.id} 
                              className={`p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                                isSelected 
                                  ? "bg-blue-50/60 border-l-4 border-l-blue-600" 
                                  : isOutOfStock
                                    ? "bg-slate-50/50 opacity-70"
                                    : "hover:bg-slate-50/80"
                              }`}
                            >
                              {/* Component Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-slate-900 text-sm">{item.name}</span>
                                  <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 text-slate-600 border-slate-200 bg-slate-50">
                                    {item.sku}
                                  </Badge>
                                  {item.category && (
                                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-slate-100 text-slate-700 border-none">
                                      {item.category}
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 mt-1.5 text-xs">
                                  {/* Availability badge */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-500 font-medium">Availability:</span>
                                    {isOutOfStock ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700">
                                        Out of Stock (0)
                                      </span>
                                    ) : isLowStock ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                                        Low Stock: {item.inStock} units
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                        In Stock: {item.inStock} units
                                      </span>
                                    )}
                                  </div>

                                  {item.pricePerUnit > 0 && (
                                    <span className="text-slate-400">
                                      • ₹{item.pricePerUnit.toLocaleString("en-IN")}/unit
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Quantity Input Controls */}
                              <div className="flex items-center gap-2 sm:self-center shrink-0">
                                {isOutOfStock ? (
                                  <div className="text-xs font-semibold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                                    Unavailable
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                                      disabled={qty <= 0}
                                      onClick={() => handleIncrement(item.id, item.inStock, -1)}
                                    >
                                      <Minus size={13} />
                                    </Button>

                                    <Input
                                      type="number"
                                      min={0}
                                      max={item.inStock}
                                      className={`h-7 w-16 text-center text-xs font-bold border-none focus-visible:ring-1 focus-visible:ring-blue-500 ${
                                        qty > 0 ? "text-blue-700 bg-blue-50/50 rounded" : "text-slate-700"
                                      }`}
                                      placeholder="0"
                                      value={qty === 0 ? "" : qty}
                                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10), item.inStock)}
                                    />

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                                      disabled={qty >= item.inStock}
                                      onClick={() => handleIncrement(item.id, item.inStock, 1)}
                                    >
                                      <Plus size={13} />
                                    </Button>

                                    {/* Quick Increment Helpers */}
                                    <div className="flex gap-1 pl-1 border-l border-slate-100">
                                      {item.inStock >= 5 && (
                                        <button
                                          type="button"
                                          className="px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                          onClick={() => handleIncrement(item.id, item.inStock, 5)}
                                          title="Add 5"
                                        >
                                          +5
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        className="px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                        onClick={() => handleQuantityChange(item.id, item.inStock, item.inStock)}
                                        title="Dispatch all in stock"
                                      >
                                        Max
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Modal Footer */}
          <DialogFooter className="p-4 border-t bg-slate-50/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {(() => {
              const selectedCount = Object.values(dispatchQuantities).filter(q => q > 0).length;
              const totalUnits = Object.values(dispatchQuantities).reduce((acc, q) => acc + (q || 0), 0);

              return (
                <>
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {selectedCount} component{selectedCount === 1 ? "" : "s"} selected
                    </span>
                    <span>•</span>
                    <span className="font-bold text-blue-700">
                      {totalUnits} unit{totalUnits === 1 ? "" : "s"} to dispatch
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsDispatchModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2 min-w-[160px] font-semibold"
                      onClick={onConfirmMultiDispatch}
                      disabled={createDispatch.isPending || selectedCount === 0}
                    >
                      {createDispatch.isPending ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Dispatching...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          Confirm Dispatch ({totalUnits} Units)
                        </>
                      )}
                    </Button>
                  </div>
                </>
              );
            })()}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dispatch Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="text-amber-600" size={20} />
              Edit Dispatch Record
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Item</label>
              <Input disabled value={selectedRecord?.itemName || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Quantity</label>
              <Input 
                type="number" 
                min={1} 
                value={editForm.quantity} 
                onChange={(e) => setEditForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Notes</label>
              <Input 
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={onConfirmEdit}
              disabled={updateDispatch.isPending}
            >
              {updateDispatch.isPending ? <Loader2 className="animate-spin" size={16} /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="text-slate-600" size={20} />
              Dispatch History & Returns
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {(() => {
              const getRecordPrice = (record: DispatchedMaterialRecord) => {
                if (record.pricePerUnit !== undefined && record.pricePerUnit > 0) {
                  return record.pricePerUnit;
                }
                const matchingItem = inventory?.find(i => String(i.id) === String(record.itemId));
                return matchingItem?.pricePerUnit ?? 0;
              };

              const totalDispatchesCost = customerDispatches.reduce((acc, rec) => {
                return acc + (rec.quantity * getRecordPrice(rec));
              }, 0);

              const totalDispatchesUnits = customerDispatches.reduce((acc, rec) => {
                return acc + rec.quantity;
              }, 0);

              if (customerDispatches.length === 0) {
                return (
                  <div className="text-center py-10 bg-slate-50 rounded-lg">
                    <p className="text-slate-500">No records found.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Units Dispatched</span>
                      <span className="text-2xl font-extrabold text-slate-800 mt-1">{totalDispatchesUnits}</span>
                    </div>
                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col justify-center">
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Dispatch Cost</span>
                      <span className="text-2xl font-extrabold text-blue-800 mt-1">₹{totalDispatchesCost.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* List of dispatches */}
                  <div className="space-y-3">
                    {customerDispatches.map((record) => {
                      const itemPrice = getRecordPrice(record);
                      const itemTotal = record.quantity * itemPrice;
                      return (
                        <div key={record.id} className="p-4 border rounded-lg bg-slate-50 flex justify-between items-center group hover:border-slate-300 transition-colors">
                          <div>
                            <div className="font-bold text-slate-900">{record.itemName}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Calendar size={12} /> {format(new Date(record.dispatchedAt), "dd MMM yyyy, hh:mm a")}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                              Unit Price: ₹{itemPrice.toLocaleString("en-IN")}
                            </div>
                            {record.notes && <div className="text-[11px] text-slate-600 mt-1.5 italic">{record.notes}</div>}
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-lg font-black text-slate-800">{record.quantity}</div>
                              <div className="text-[10px] uppercase font-bold text-slate-500">Units</div>
                              <div className="text-xs font-semibold text-blue-600 mt-0.5">₹{itemTotal.toLocaleString("en-IN")}</div>
                            </div>
                            
                            {canManage && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(record)}><Edit2 size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => handleDeleteRecord(record.id)}><RotateCcw size={14} /></Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsHistoryModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </SidebarLayout>
  );
}
