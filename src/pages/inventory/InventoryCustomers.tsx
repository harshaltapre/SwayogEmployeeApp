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
  Download
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
  
  const [dispatchCount, setDispatchCount] = useState(1);
  const [multiDispatchItems, setMultiDispatchItems] = useState<{itemId: string, quantity: number}[]>([{itemId: "", quantity: 1}]);
  const [dispatchDate, setDispatchDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dispatchNotes, setDispatchNotes] = useState("");

  const [editForm, setEditForm] = useState({
    quantity: 1,
    notes: ""
  });

  const { toast } = useToast();
  const { data: customers, isLoading: isLoadingCustomers } = useListCustomers({ search: search || undefined });
  const { data: inventory } = useListInventory();
  const { data: allDispatches } = useListDispatchedMaterials();

  const createDispatch = useCreateDispatchRecord();
  const updateDispatch = useUpdateDispatchRecord();
  const deleteDispatch = useDeleteDispatchRecord();

  const handleOpenDispatch = (customer: CustomerRecord) => {
    setSelectedCustomer(customer);
    setDispatchCount(1);
    setMultiDispatchItems([{itemId: "", quantity: 1}]);
    setDispatchDate(format(new Date(), "yyyy-MM-dd"));
    setDispatchNotes("");
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

  const onUpdateDispatchCount = (count: number) => {
    const val = Math.max(1, Math.min(20, count));
    setDispatchCount(val);
    const newItems = [...multiDispatchItems];
    if (val > newItems.length) {
      for (let i = newItems.length; i < val; i++) {
        newItems.push({ itemId: "", quantity: 1 });
      }
    } else {
      newItems.splice(val);
    }
    setMultiDispatchItems(newItems);
  };

  const onConfirmMultiDispatch = async () => {
    if (!selectedCustomer) return;
    
    const validItems = multiDispatchItems.filter(item => item.itemId && item.quantity > 0);
    if (validItems.length === 0) {
      toast({ title: "Error", description: "Please select at least one item with quantity.", variant: "destructive" });
      return;
    }

    try {
      for (const itemData of validItems) {
        const item = inventory?.find(i => String(i.id) === itemData.itemId);
        if (!item) continue;

        await createDispatch.mutateAsync({
          data: {
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            itemId: item.id,
            itemName: item.name,
            quantity: itemData.quantity,
            notes: dispatchNotes,
            dispatchedAt: new Date(dispatchDate).toISOString()
          }
        });
      }
      
      toast({ title: "Success", description: `${validItems.length} items dispatched successfully.` });
      setIsDispatchModalOpen(false);
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong during dispatch.", variant: "destructive" });
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
                  customers?.map((customer) => {
                    const dispatchCount = allDispatches?.filter(d => d.customerId === customer.id).length ?? 0;
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
                          {dispatchCount > 0 ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 font-medium">
                              <ArrowRightLeft size={10} /> {dispatchCount} Item{dispatchCount > 1 ? 's' : ''} Dispatched
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
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Bulk Dispatch Modal */}
      <Dialog open={isDispatchModalOpen} onOpenChange={setIsDispatchModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="text-blue-600" size={20} />
              Dispatch Materials to {selectedCustomer?.name}
            </DialogTitle>
            <DialogDescription>
              Select items, quantities, and the dispatch date.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Dispatch Date</label>
                <Input 
                  type="date" 
                  value={dispatchDate} 
                  onChange={(e) => setDispatchDate(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Number of Items to Dispatch</label>
                <Input 
                  type="number" 
                  min={1} 
                  max={20}
                  value={dispatchCount} 
                  onChange={(e) => onUpdateDispatchCount(Number(e.target.value))}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              {multiDispatchItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="col-span-8 space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500">Item {index + 1}</label>
                    <Select 
                      value={item.itemId} 
                      onValueChange={(val) => {
                        const newItems = [...multiDispatchItems];
                        newItems[index].itemId = val;
                        setMultiDispatchItems(newItems);
                      }}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Choose material..." />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory?.map(inv => (
                          <SelectItem key={inv.id} value={String(inv.id)}>
                            {inv.name} ({inv.inStock} in stock)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500">Quantity</label>
                    <Input 
                      type="number" 
                      min={1} 
                      className="bg-white"
                      value={item.quantity} 
                      onChange={(e) => {
                        const newItems = [...multiDispatchItems];
                        newItems[index].quantity = Number(e.target.value);
                        setMultiDispatchItems(newItems);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Overall Dispatch Notes</label>
              <Input 
                placeholder="e.g. Main installation batch..." 
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDispatchModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 min-w-[150px]"
              onClick={onConfirmMultiDispatch}
              disabled={createDispatch.isPending}
            >
              {createDispatch.isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              Confirm Bulk Dispatch
            </Button>
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
