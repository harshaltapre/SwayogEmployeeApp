import { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import {
  AlertCircle,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  FilePlus2,
  FileText,
  IndianRupee,
  Lock,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  buildAssetUrlFromPath,
  useApproveVendorBill,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useCreateInvoice,
  useCreateVendor,
  useCreateVendorBill,
  useUpdateVendorBill,
  useDeleteVendorBill,
  useGetCustomerLedger,
  useGetFinanceMe,
  useGetFinancialSummary,
  useGetGeneralLedger,
  useGetMonthlyPnL,
  useGetVendorPayables,
  useGetZoneBreakdown,
  useListCustomers,
  useListInvoices,
  useListPartnerPayouts,
  useListVendorBills,
  useListVendors,
  useRecordVendorPayment,
  useUpdateInvoice,
  type VendorBillItemRecord,
  type VendorBillRecord,
  type VendorMasterRecord,
} from "@/lib/api-client";
import { getFinanceLevel, useAuth } from "@/lib/auth";
import { usePollWithVisibility } from "@/lib/data-sync";

const LEVEL_LABELS: Record<string, string> = {
  executive: "Finance Executive / Accountant",
  manager: "Finance Manager",
  head: "Finance Head",
  admin: "Admin Oversight",
};

const VALID_TABS = new Set(["overview", "customers", "invoices", "vendors", "ledger", "payouts", "zones", "pnl"]);

function formatInr(value: number | null | undefined): string {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function FinanceDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const search = useSearch();
  const urlTab = new URLSearchParams(search).get("tab") || "overview";

  const [activeTab, setActiveTab] = useState(VALID_TABS.has(urlTab) ? urlTab : "overview");
  useEffect(() => {
    if (VALID_TABS.has(urlTab)) setActiveTab(urlTab);
  }, [urlTab]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState<"all" | "dues" | "unbilled">("all");
  const [billStatusFilter, setBillStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [billSearch, setBillSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(() => new Date());

  // Create Customer Invoice modal state
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invCustomerId, setInvCustomerId] = useState("");
  const [invType, setInvType] = useState("installation");
  const [invNumber, setInvNumber] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [invDate, setInvDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [invStatus, setInvStatus] = useState("pending");
  const [invMethod, setInvMethod] = useState("bank_transfer");
  const [invDesc, setInvDesc] = useState("");

  // Record Customer Payment modal state
  const [payModalInv, setPayModalInv] = useState<any | null>(null);
  const [payAmountPaid, setPayAmountPaid] = useState("");
  const [payStatus, setPayStatus] = useState("paid");

  // Record Operational Expense modal state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<any | null>(null);
  const [expCategory, setExpCategory] = useState("Site Logistics");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [expZone, setExpZone] = useState("");
  const [expNotes, setExpNotes] = useState("");

  // Create Vendor Master modal state
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [vName, setVName] = useState("");
  const [vType, setVType] = useState("MATERIAL_SUPPLIER");
  const [vGstin, setVGstin] = useState("");
  const [vPan, setVPan] = useState("");
  const [vContact, setVContact] = useState("");
  const [vPhone, setVPhone] = useState("");
  const [vEmail, setVEmail] = useState("");
  const [vState, setVState] = useState("Maharashtra");
  const [vPinCode, setVPinCode] = useState("");
  const [vAddress, setVAddress] = useState("");
  const [vBankAcc, setVBankAcc] = useState("");
  const [vIfsc, setVIfsc] = useState("");
  const [vTerms, setVTerms] = useState("30");
  const [vOpeningBal, setVOpeningBal] = useState("0");
  const [vTdsApplicable, setVTdsApplicable] = useState(false);
  const [vTdsRate, setVTdsRate] = useState("2");

  // Create / Edit Vendor Bill modal state
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<VendorBillRecord | null>(null);
  const [deletingBill, setDeletingBill] = useState<VendorBillRecord | null>(null);
  const [bVendorId, setBVendorId] = useState("");
  const [bInvoiceNo, setBInvoiceNo] = useState("");
  const [bInvoiceDate, setBInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [bDueDate, setBDueDate] = useState(() => new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  const [bPoRef, setBPoRef] = useState("");
  const [bGrnRef, setBGrnRef] = useState("");
  const [bCustomerId, setBCustomerId] = useState("none");
  const [bZone, setBZone] = useState("");
  const [bCategory, setBCategory] = useState("Material Purchase");
  const [bSupplyType, setBSupplyType] = useState<"INTRA_STATE" | "INTER_STATE">("INTRA_STATE");
  const [bOtherCharges, setBOtherCharges] = useState("0");
  const [bTdsRate, setBTdsRate] = useState("0");
  const [bItcEligible, setBItcEligible] = useState(true);
  const [bSubmitMode, setBSubmitMode] = useState<"DRAFT" | "AWAITING_APPROVAL" | "OPEN">("OPEN");
  const [bNotes, setBNotes] = useState("");
  const [bItems, setBItems] = useState<VendorBillItemRecord[]>([
    { itemName: "Solar DC Cable 4 sq mm", hsnSac: "8544", quantity: 100, unit: "metre", rate: 35, discountPct: 0, gstRate: 18 },
  ]);

  // Record Vendor Payment modal state
  const [vendorPayBill, setVendorPayBill] = useState<VendorBillRecord | null>(null);
  const [vpAmount, setVpAmount] = useState("");
  const [vpTds, setVpTds] = useState("0");
  const [vpMode, setVpMode] = useState("NEFT");
  const [vpRefNo, setVpRefNo] = useState("");
  const [vpBankAccount, setVpBankAccount] = useState("Primary Current Account");
  const [vpDate, setVpDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [vpNotes, setVpNotes] = useState("");

  const queryParams = { from: fromDate || undefined, to: toDate || undefined };

  const { data: financeMe } = useGetFinanceMe();
  const effectiveLevel = financeMe?.level ?? getFinanceLevel(user);
  const canViewCompanyPnl =
    effectiveLevel === "manager" || effectiveLevel === "head" || effectiveLevel === "admin";

  const { data: summary, isLoading: isLoadingSummary, refetch: refetchSummary } =
    useGetFinancialSummary(queryParams);
  const { data: ledgerData, isLoading: isLoadingLedger, refetch: refetchLedger } =
    useGetCustomerLedger();
  const { data: vendorData, isLoading: isLoadingVendors, refetch: refetchVendors } =
    useGetVendorPayables(queryParams);
  const { data: vendorsMaster = [], isLoading: isLoadingVendorMaster, refetch: refetchVendorMaster } =
    useListVendors();
  const { data: vendorBills = [], isLoading: isLoadingBills, refetch: refetchVendorBills } =
    useListVendorBills(queryParams);
  const { data: glData, isLoading: isLoadingGl, refetch: refetchGl } =
    useGetGeneralLedger();
  const { data: invoicesData, isLoading: isLoadingInvoices, refetch: refetchInvoices } =
    useListInvoices(undefined, { query: queryParams });
  const { data: payoutsData, isLoading: isLoadingPayouts } = useListPartnerPayouts(queryParams);
  const { data: zonesData, isLoading: isLoadingZones } = useGetZoneBreakdown(queryParams);
  const { data: pnlData, isLoading: isLoadingPnl } = useGetMonthlyPnL(queryParams, {
    query: { enabled: canViewCompanyPnl },
  });
  const { data: customersList = [] } = useListCustomers();

  const createInvoice = useCreateInvoice({
    mutation: {
      onSuccess: () => {
        toast({ title: "Invoice created", description: "Customer ledger, AR & Double-Entry GL updated." });
        setInvoiceModalOpen(false);
        setInvAmount("");
        setInvNumber("");
        setInvDesc("");
        refetchSummary();
        refetchLedger();
        refetchInvoices();
        refetchGl();
      },
      onError: (err: any) => {
        toast({ title: "Failed to create invoice", description: err?.message || "Check fields", variant: "destructive" });
      },
    },
  });

  const updateInvoice = useUpdateInvoice({
    mutation: {
      onSuccess: () => {
        toast({ title: "Invoice updated", description: "Collection status and GL synced." });
        setPayModalInv(null);
        refetchSummary();
        refetchLedger();
        refetchInvoices();
        refetchGl();
      },
      onError: (err: any) => {
        toast({ title: "Update failed", description: err?.message || "Error", variant: "destructive" });
      },
    },
  });

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const createVendor = useCreateVendor();
  const createVendorBill = useCreateVendorBill();
  const updateVendorBill = useUpdateVendorBill();
  const deleteVendorBill = useDeleteVendorBill();
  const approveVendorBill = useApproveVendorBill();
  const recordVendorPayment = useRecordVendorPayment();

  usePollWithVisibility("finance-workspace", 60000);

  // Live preview calculation for New Vendor Bill modal
  const liveBillCalc = useMemo(() => {
    let subtotal = 0;
    let discountAmount = 0;
    let taxableAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    for (const item of bItems) {
      const qty = Math.max(Number(item.quantity) || 0, 0);
      const rate = Math.max(Number(item.rate) || 0, 0);
      const discPct = Math.min(Math.max(Number(item.discountPct) || 0, 0), 100);
      const gstRate = Math.min(Math.max(Number(item.gstRate) || 0, 0), 28);

      const gross = qty * rate;
      const disc = gross * (discPct / 100);
      const taxable = gross - disc;
      const gstTotal = taxable * (gstRate / 100);

      subtotal += gross;
      discountAmount += disc;
      taxableAmount += taxable;
      if (bSupplyType === "INTER_STATE") {
        igstAmount += gstTotal;
      } else {
        cgstAmount += gstTotal / 2;
        sgstAmount += gstTotal / 2;
      }
    }

    const other = Math.max(Number(bOtherCharges) || 0, 0);
    const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount + other;
    const tdsPct = Math.min(Math.max(Number(bTdsRate) || 0, 0), 30);
    const tdsAmount = taxableAmount * (tdsPct / 100);
    const netPayable = Math.max(totalAmount - tdsAmount, 0);

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      other,
      totalAmount,
      tdsAmount,
      netPayable,
    };
  }, [bItems, bSupplyType, bOtherCharges, bTdsRate]);

  const invoices = invoicesData ?? [];
  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return invoices.filter((inv: any) => {
      const typeMatch =
        invoiceFilter === "all" ||
        String(inv.invoiceType || "").toLowerCase() === invoiceFilter;
      if (!typeMatch) return false;
      if (!q) return true;
      return (
        String(inv.customer || "").toLowerCase().includes(q) ||
        String(inv.invoiceNumber || inv.id || "").toLowerCase().includes(q) ||
        String(inv.description || "").toLowerCase().includes(q)
      );
    });
  }, [invoices, invoiceFilter, searchQuery]);

  const filteredCustomers = useMemo(() => {
    const list = ledgerData?.customers ?? [];
    const q = customerSearch.trim().toLowerCase();
    return list.filter((c) => {
      if (customerFilter === "dues" && !(c.receivableBalance > 0)) return false;
      if (customerFilter === "unbilled" && !(c.unbilledContract && c.unbilledContract > 0)) return false;
      if (!q) return true;
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    });
  }, [ledgerData, customerFilter, customerSearch]);

  const filteredVendorsMaster = useMemo(() => {
    const q = vendorSearch.trim().toLowerCase();
    if (!q) return vendorsMaster;
    return vendorsMaster.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.vendorCode.toLowerCase().includes(q) ||
        (v.gstin && v.gstin.toLowerCase().includes(q))
    );
  }, [vendorsMaster, vendorSearch]);

  const filteredVendorBills = useMemo(() => {
    const q = billSearch.trim().toLowerCase();
    return vendorBills.filter((b) => {
      const effStatus = b.effectiveStatus || b.status;
      if (billStatusFilter !== "ALL" && effStatus !== billStatusFilter && b.status !== billStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        b.billNumber.toLowerCase().includes(q) ||
        b.vendorInvoiceNo.toLowerCase().includes(q) ||
        (b.vendor?.name || "").toLowerCase().includes(q) ||
        (b.customer?.fullName || "").toLowerCase().includes(q)
      );
    });
  }, [vendorBills, billStatusFilter, billSearch]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchSummary(),
        refetchLedger(),
        refetchVendors(),
        refetchVendorMaster(),
        refetchVendorBills(),
        refetchGl(),
        refetchInvoices(),
      ]);
      setLastSyncedAt(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const openNewInvoiceForCustomer = (customerId?: number) => {
    setInvCustomerId(customerId ? String(customerId) : "");
    setInvoiceModalOpen(true);
  };

  const openNewBillForVendor = (vendor?: VendorMasterRecord) => {
    setEditingBill(null);
    setBInvoiceNo("");
    setBPoRef("");
    setBGrnRef("");
    setBNotes("");
    setBOtherCharges("0");
    setBInvoiceDate(new Date().toISOString().split("T")[0]);
    setBSubmitMode("OPEN");
    setBItems([
      { itemName: "Solar DC Cable 4 sq mm", hsnSac: "8544", quantity: 100, unit: "metre", rate: 35, discountPct: 0, gstRate: 18 },
    ]);
    if (vendor) {
      setBVendorId(vendor.id);
      setBTdsRate(vendor.tdsApplicable ? String(vendor.defaultTdsRate || 2) : "0");
      const days = vendor.paymentTermsDays || 30;
      setBDueDate(new Date(Date.now() + days * 86400000).toISOString().split("T")[0]);
    } else if (vendorsMaster.length > 0 && !bVendorId) {
      setBVendorId(vendorsMaster[0].id);
      setBDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
    }
    setBillModalOpen(true);
  };

  const openEditBillModal = (bill: VendorBillRecord) => {
    setEditingBill(bill);
    setBVendorId(bill.vendorId);
    setBInvoiceNo(bill.vendorInvoiceNo || "");
    setBCategory(bill.category || "Material Purchase");
    setBInvoiceDate(bill.invoiceDate ? bill.invoiceDate.split("T")[0] : new Date().toISOString().split("T")[0]);
    setBDueDate(bill.dueDate ? bill.dueDate.split("T")[0] : "");
    setBPoRef(bill.purchaseOrderRef || "");
    setBGrnRef(bill.grnRef || "");
    setBCustomerId(bill.customerId ? String(bill.customerId) : "none");
    setBSupplyType(bill.supplyType || "INTRA_STATE");
    setBZone(bill.zone || "");
    setBOtherCharges(String(bill.otherCharges || 0));
    setBTdsRate(String(bill.tdsRate || 0));
    setBItcEligible(bill.itcEligible !== undefined ? bill.itcEligible : true);
    setBSubmitMode(
      bill.status === "DRAFT"
        ? "DRAFT"
        : bill.status === "AWAITING_APPROVAL"
          ? "AWAITING_APPROVAL"
          : "OPEN"
    );
    setBNotes(bill.notes || "");
    if (bill.items && bill.items.length > 0) {
      setBItems(
        bill.items.map((item) => ({
          itemName: item.itemName,
          hsnSac: item.hsnSac || "",
          quantity: item.quantity,
          unit: item.unit || "nos",
          rate: item.rate,
          discountPct: item.discountPct || 0,
          gstRate: item.gstRate,
        }))
      );
    } else {
      setBItems([
        { itemName: "Solar Supplies", hsnSac: "8541", quantity: 1, unit: "nos", rate: bill.taxableAmount || 0, discountPct: 0, gstRate: 18 },
      ]);
    }
    setBillModalOpen(true);
  };

  const openRecordVendorPaymentModal = (bill: VendorBillRecord) => {
    setVendorPayBill(bill);
    setVpAmount(String(bill.balanceDue));
    setVpTds("0");
    setVpRefNo("");
    setVpNotes("");
  };

  const handleCreateVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim()) {
      toast({ title: "Vendor name is required", variant: "destructive" });
      return;
    }
    try {
      const created = await createVendor.mutateAsync({
        name: vName.trim(),
        vendorType: vType,
        gstin: vGstin.trim() || undefined,
        pan: vPan.trim() || undefined,
        contactPerson: vContact.trim() || undefined,
        phone: vPhone.trim() || undefined,
        email: vEmail.trim() || undefined,
        state: vState.trim() || undefined,
        pinCode: vPinCode.trim() || undefined,
        address: vAddress.trim() || undefined,
        bankAccountNumber: vBankAcc.trim() || undefined,
        ifscCode: vIfsc.trim() || undefined,
        paymentTermsDays: Number(vTerms) || 30,
        openingBalance: Number(vOpeningBal) || 0,
        tdsApplicable: vTdsApplicable,
        defaultTdsRate: vTdsApplicable ? Number(vTdsRate) || 0 : 0,
      });
      toast({ title: "Vendor added to Master", description: `${created.name} (${created.vendorCode})` });
      setVendorModalOpen(false);
      setVName("");
      setVGstin("");
      setVPan("");
      setVPhone("");
      setVEmail("");
      setVBankAcc("");
      setVIfsc("");
      refetchVendorMaster();
    } catch (err: any) {
      toast({ title: "Failed to create vendor", description: err?.message, variant: "destructive" });
    }
  };

  const handleVendorBillFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bVendorId || !bInvoiceNo.trim()) {
      toast({ title: "Select a vendor and enter the supplier's invoice number", variant: "destructive" });
      return;
    }
    try {
      if (editingBill) {
        const updated = await updateVendorBill.mutateAsync({
          id: editingBill.id,
          data: {
            vendorId: bVendorId,
            vendorInvoiceNo: bInvoiceNo.trim(),
            invoiceDate: bInvoiceDate,
            dueDate: bDueDate,
            purchaseOrderRef: bPoRef.trim() || undefined,
            grnRef: bGrnRef.trim() || undefined,
            customerId: bCustomerId !== "none" ? Number(bCustomerId) : undefined,
            zone: bZone.trim() || undefined,
            category: bCategory,
            supplyType: bSupplyType,
            otherCharges: Number(bOtherCharges) || 0,
            tdsRate: Number(bTdsRate) || 0,
            itcEligible: bItcEligible,
            submitMode: bSubmitMode,
            notes: bNotes.trim() || undefined,
            items: bItems,
          },
        });
        toast({
          title: `Vendor Bill ${updated.billNumber} updated`,
          description: `Net Payable ${formatInr(updated.netPayable)} · Status: ${updated.status}. Double-entry General Ledger synchronized.`,
        });
      } else {
        const created = await createVendorBill.mutateAsync({
          vendorId: bVendorId,
          vendorInvoiceNo: bInvoiceNo.trim(),
          invoiceDate: bInvoiceDate,
          dueDate: bDueDate,
          purchaseOrderRef: bPoRef.trim() || undefined,
          grnRef: bGrnRef.trim() || undefined,
          customerId: bCustomerId !== "none" ? Number(bCustomerId) : undefined,
          zone: bZone.trim() || undefined,
          category: bCategory,
          supplyType: bSupplyType,
          otherCharges: Number(bOtherCharges) || 0,
          tdsRate: Number(bTdsRate) || 0,
          itcEligible: bItcEligible,
          submitMode: bSubmitMode,
          notes: bNotes.trim() || undefined,
          items: bItems,
        });
        toast({
          title: `Vendor Bill ${created.billNumber} recorded`,
          description:
            created.status === "APPROVED"
              ? `Net Payable ${formatInr(created.netPayable)} posted to AP & General Ledger.`
              : `Saved with status: ${created.status}.`,
        });
      }
      setBillModalOpen(false);
      setEditingBill(null);
      setBInvoiceNo("");
      setBPoRef("");
      setBGrnRef("");
      setBNotes("");
      refetchVendorBills();
      refetchVendorMaster();
      refetchVendors();
      refetchSummary();
      refetchGl();
    } catch (err: any) {
      toast({
        title: editingBill ? "Failed to update vendor bill" : "Failed to record vendor bill",
        description: err?.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteBillSubmit = async () => {
    if (!deletingBill) return;
    try {
      await deleteVendorBill.mutateAsync(deletingBill.id);
      toast({
        title: `Vendor Bill ${deletingBill.billNumber} deleted`,
        description: "Bill, line items, and journal entries removed from Accounts Payable.",
      });
      setDeletingBill(null);
      refetchVendorBills();
      refetchVendorMaster();
      refetchVendors();
      refetchSummary();
      refetchGl();
    } catch (err: any) {
      toast({ title: "Failed to delete bill", description: err?.message, variant: "destructive" });
    }
  };

  const handleApproveBill = async (billId: string) => {
    try {
      const approved = await approveVendorBill.mutateAsync(billId);
      toast({
        title: `Bill ${approved.billNumber} Approved`,
        description: "Payable and Double-Entry Journal lines posted to General Ledger.",
      });
      refetchVendorBills();
      refetchVendorMaster();
      refetchVendors();
      refetchGl();
    } catch (err: any) {
      toast({ title: "Approval failed", description: err?.message, variant: "destructive" });
    }
  };

  const handleRecordVendorPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorPayBill) return;
    const amt = Number(vpAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast({ title: "Enter a valid payment amount", variant: "destructive" });
      return;
    }
    try {
      const res = await recordVendorPayment.mutateAsync({
        vendorId: vendorPayBill.vendorId,
        billId: vendorPayBill.id,
        amount: amt,
        tdsDeducted: Number(vpTds) || 0,
        paymentDate: vpDate,
        paymentMode: vpMode,
        referenceNo: vpRefNo.trim() || undefined,
        bankAccount: vpBankAccount.trim() || undefined,
        notes: vpNotes.trim() || undefined,
      });
      const updatedBill = res?.bill;
      toast({
        title: `Payment ${res?.paymentNumber || ""} recorded`,
        description: updatedBill
          ? `Bill status: ${updatedBill.status} · Remaining Balance: ${formatInr(updatedBill.balanceDue)}`
          : "Vendor ledger and bank book updated.",
      });
      setVendorPayBill(null);
      refetchVendorBills();
      refetchVendorMaster();
      refetchVendors();
      refetchSummary();
      refetchGl();
    } catch (err: any) {
      toast({ title: "Payment failed", description: err?.message, variant: "destructive" });
    }
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invCustomerId || !invAmount || Number(invAmount) <= 0) {
      toast({ title: "Select a customer and enter a valid amount", variant: "destructive" });
      return;
    }
    createInvoice.mutate({
      data: {
        customerId: Number(invCustomerId),
        invoiceType: invType,
        invoiceNumber: invNumber || undefined,
        amount: Number(invAmount),
        date: invDate,
        status: invStatus,
        paymentMethod: invMethod,
        description: invDesc || `${invType.toUpperCase()} milestone billing`,
      },
    });
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalInv) return;
    updateInvoice.mutate({
      id: payModalInv.id,
      data: {
        amountPaid: payAmountPaid === "" ? undefined : Number(payAmountPaid),
        status: payStatus,
      },
    });
  };

  const openNewExpenseModal = () => {
    setEditingExpense(null);
    setExpCategory("Site Logistics");
    setExpAmount("");
    setExpDate(new Date().toISOString().split("T")[0]);
    setExpZone("");
    setExpNotes("");
    setExpenseModalOpen(true);
  };

  const openEditExpenseModal = (exp: any) => {
    setEditingExpense(exp);
    setExpCategory(exp.category || "Site Logistics");
    setExpAmount(String(exp.amount || ""));
    setExpDate(exp.expenseDate ? new Date(exp.expenseDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    setExpZone(exp.zone || "");
    setExpNotes(exp.notes || "");
    setExpenseModalOpen(true);
  };

  const handleExpenseFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCategory.trim() || !expAmount || Number(expAmount) <= 0) {
      toast({ title: "Enter category and valid amount", variant: "destructive" });
      return;
    }
    try {
      if (editingExpense) {
        await updateExpense.mutateAsync({
          id: editingExpense.id,
          data: {
            category: expCategory,
            amount: Number(expAmount),
            expenseDate: expDate,
            zone: expZone || undefined,
            notes: expNotes || undefined,
          },
        });
        toast({ title: "Expense updated", description: "Operational Expense & General Ledger synchronized." });
      } else {
        await createExpense.mutateAsync({
          category: expCategory,
          amount: Number(expAmount),
          expenseDate: expDate,
          zone: expZone || undefined,
          notes: expNotes || undefined,
        });
        toast({ title: "Expense recorded", description: "Posted to Operational Expenses & General Ledger." });
      }
      setExpenseModalOpen(false);
      setEditingExpense(null);
      setExpAmount("");
      setExpNotes("");
      refetchVendors();
      refetchSummary();
      refetchGl();
    } catch (err: any) {
      toast({
        title: editingExpense ? "Failed to update expense" : "Failed to record expense",
        description: err?.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpenseSubmit = async () => {
    if (!deletingExpense) return;
    try {
      await deleteExpense.mutateAsync(deletingExpense.id);
      toast({ title: "Expense deleted", description: "Expense and corresponding ledger entry removed." });
      setDeletingExpense(null);
      refetchVendors();
      refetchSummary();
      refetchGl();
    } catch (err: any) {
      toast({ title: "Failed to delete expense", description: err?.message, variant: "destructive" });
    }
  };

  const handleExportCsv = () => {
    if (activeTab === "vendors" && filteredVendorBills.length > 0) {
      const headers = ["Bill Number", "Vendor", "Supplier Invoice No", "Invoice Date", "Due Date", "Taxable", "GST", "TDS", "Net Payable", "Paid", "Balance Due", "Status"];
      const rows = filteredVendorBills.map((b) => [
        `"${b.billNumber}"`,
        `"${b.vendor?.name || ""}"`,
        `"${b.vendorInvoiceNo}"`,
        `"${new Date(b.invoiceDate).toLocaleDateString("en-IN")}"`,
        `"${new Date(b.dueDate).toLocaleDateString("en-IN")}"`,
        b.taxableAmount,
        (b.cgstAmount || 0) + (b.sgstAmount || 0) + (b.igstAmount || 0),
        b.tdsAmount,
        b.netPayable,
        b.amountPaid,
        b.balanceDue,
        `"${b.effectiveStatus || b.status}"`,
      ]);
      const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `swayog_vendor_bills_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    if (filteredInvoices.length === 0) {
      toast({ title: "No records to export", variant: "destructive" });
      return;
    }
    const headers = ["Invoice", "Customer", "Type", "Invoiced", "Collected", "Outstanding", "Date", "Status"];
    const rows = filteredInvoices.map((inv: any) => [
      `"${inv.invoiceNumber || inv.id}"`,
      `"${inv.customer || "N/A"}"`,
      `"${inv.invoiceType || "INSTALLATION"}"`,
      inv.amount ?? 0,
      inv.amountPaid ?? 0,
      inv.outstanding ?? Math.max((inv.amount ?? 0) - (inv.amountPaid ?? 0), 0),
      `"${inv.date || ""}"`,
      `"${inv.status || inv.paymentStatus || ""}"`,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `swayog_invoices_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const invoicedTotal = summary?.totalInvoiced ?? summary?.totalRevenue ?? 0;
  const collectedTotal = summary?.collected ?? 0;
  const outstandingTotal = summary?.outstanding ?? summary?.pendingDues ?? 0;
  const vendorApOutstanding = vendorData?.summary.vendorOutstandingTotal ?? summary?.vendorPayablesOutstanding ?? 0;
  const netCashFlow = summary?.netCashFlow ?? collectedTotal - (vendorData?.summary.vendorPaidTotal ?? 0) - (vendorData?.summary.totalExpenses ?? 0);
  const managerLimit = financeMe?.managerApprovalLimit ?? 100000;

  return (
    <SidebarLayout>
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <PageHeader
          title="Finance & Accounts ERP Workspace"
          description="Integrated Accounts Receivable (AR), Accounts Payable (Vendor Bills & Payments), Expenses, Commissions & Double-Entry General Ledger"
        />

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 bg-card border rounded-lg px-2.5 py-1.5 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs bg-transparent border-none focus:outline-none text-foreground cursor-pointer"
              aria-label="From date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs bg-transparent border-none focus:outline-none text-foreground cursor-pointer"
              aria-label="To date"
            />
            {(fromDate || toDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[10px] text-rose-500"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
              >
                Clear
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Sync
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            CSV Export
          </Button>
        </div>
      </div>

      {/* Quick Financial Actions Bar */}
      <Card className="mb-5 border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
        <CardContent className="py-3 px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>{effectiveLevel ? LEVEL_LABELS[effectiveLevel] ?? effectiveLevel : "Finance Workspace"}</strong>
              {" · "}
              Last synced {lastSyncedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              {" · "}
              {glData?.summary.isBalanced !== false ? "Double-Entry GL Balanced" : "Check Trial Balance"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => openNewBillForVendor()} className="gap-1.5">
              <FilePlus2 className="w-3.5 h-3.5" />
              + New Vendor Bill
            </Button>
            <Button size="sm" variant="outline" onClick={() => setVendorModalOpen(true)} className="gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              + Add Vendor
            </Button>
            <Button size="sm" variant="outline" onClick={() => openNewInvoiceForCustomer()} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              + Customer Invoice
            </Button>
            <Button size="sm" variant="secondary" onClick={openNewExpenseModal} className="gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              Record Expense
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Top KPI Cards (Accrual AR/AP + Cash Flow Separation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {isLoadingSummary || isLoadingVendors ? (
          [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between pb-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Customer Receivables (AR)</p>
                  <div className="h-8 w-8 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold">{formatInr(outstandingTotal)}</div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {summary?.openInvoiceCount ?? 0} open invoices · {ledgerData?.summary.customersWithDues ?? 0} customers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between pb-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Collections vs Revenue</p>
                  <div className="h-8 w-8 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold text-emerald-600">{formatInr(collectedTotal)}</div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  of {formatInr(invoicedTotal)} billed ({summary?.collectionRate ?? 0}%)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between pb-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Vendor Payables (AP Due)</p>
                  <div className="h-8 w-8 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-600 shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold text-rose-600">{formatInr(vendorApOutstanding)}</div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {vendorData?.summary.openVendorBillCount ?? 0} open bills · Paid: {formatInr(vendorData?.summary.vendorPaidTotal)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between pb-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Purchases &amp; Op. Expenses</p>
                  <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold">
                  {formatInr((vendorData?.summary.vendorBillsTotal || vendorData?.summary.totalMaterialPurchases || 0) + (vendorData?.summary.totalExpenses ?? 0))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Bills/Stock: {formatInr(vendorData?.summary.vendorBillsTotal || vendorData?.summary.totalMaterialPurchases)} · OpEx: {formatInr(vendorData?.summary.totalExpenses)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between pb-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Net Cash Flow &amp; ITC</p>
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className={`text-xl font-bold ${netCashFlow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatInr(netCashFlow)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  GST ITC: {formatInr(glData?.summary.totalItcAvailable)} · TDS Liability: {formatInr(glData?.summary.tdsPayable)}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Workspace Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex w-max min-w-full sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="customers">Customer Ledger (AR)</TabsTrigger>
            <TabsTrigger value="invoices">Invoices &amp; Collections</TabsTrigger>
            <TabsTrigger value="vendors">Purchases &amp; Payables (AP)</TabsTrigger>
            <TabsTrigger value="ledger">General Ledger &amp; GST</TabsTrigger>
            <TabsTrigger value="payouts">Partner Commissions</TabsTrigger>
            <TabsTrigger value="zones">Zones</TabsTrigger>
            <TabsTrigger value="pnl" disabled={!canViewCompanyPnl} className="gap-1.5">
              {!canViewCompanyPnl && <Lock className="w-3 h-3" />}
              Company P&amp;L
            </TabsTrigger>
          </TabsList>
        </div>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Customer Receivables Summary (AR)
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("customers")}>
                  Open AR Ledger →
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Approved Quotations (Contracted)</p>
                    <p className="text-lg font-semibold mt-0.5">{formatInr(ledgerData?.summary.totalContracted)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Unbilled Contract (WIP)</p>
                    <p className="text-lg font-semibold mt-0.5">{formatInr(ledgerData?.summary.totalUnbilled)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Total Invoiced</p>
                    <p className="text-lg font-semibold mt-0.5">{formatInr(ledgerData?.summary.totalInvoiced)}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-amber-500/5 border-amber-500/20">
                    <p className="text-xs text-muted-foreground">Receivable Balance Due</p>
                    <p className="text-lg font-semibold text-amber-600 mt-0.5">{formatInr(ledgerData?.summary.totalReceivable)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ledgerData?.summary.totalCustomers ?? 0} total customers · Pipeline capacity estimate (non-revenue): {formatInr(summary?.estimatedPipelineValue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Purchases, Vendor Bills &amp; Payables (AP)
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("vendors")}>
                  Open Payables &amp; Bills →
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 bg-rose-500/5 border-rose-500/20">
                    <p className="text-xs text-muted-foreground">Vendor Bills Outstanding (AP)</p>
                    <p className="text-lg font-semibold text-rose-600 mt-0.5">{formatInr(vendorData?.summary.vendorOutstandingTotal)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Vendor Payments Recorded</p>
                    <p className="text-lg font-semibold text-emerald-600 mt-0.5">{formatInr(vendorData?.summary.vendorPaidTotal)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Inventory Purchases / OpEx</p>
                    <p className="text-lg font-semibold mt-0.5">
                      {formatInr(vendorData?.summary.totalMaterialPurchases)} / {formatInr(vendorData?.summary.totalExpenses)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Partner &amp; Payroll Pending</p>
                    <p className="text-lg font-semibold mt-0.5">
                      {formatInr(vendorData?.summary.partnerPendingPayables)} / {formatInr(vendorData?.summary.payrollPending)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {vendorsMaster.length} registered vendors in Vendor Master · {vendorBills.length} recorded vendor bills.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CUSTOMER LEDGER TAB */}
        <TabsContent value="customers">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base">Customer-wise Accounts Receivable (AR Ledger)</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Search name, code, city..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="h-8 w-full sm:w-56 text-xs"
                />
                {(["all", "dues", "unbilled"] as const).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={customerFilter === f ? "default" : "outline"}
                    className="h-8 text-xs capitalize"
                    onClick={() => setCustomerFilter(f)}
                  >
                    {f === "dues" ? "With Dues" : f === "unbilled" ? "Unbilled WIP" : "All"}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {isLoadingLedger ? (
                <Skeleton className="h-40 w-full" />
              ) : filteredCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No matching customers found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>City / Size</TableHead>
                      <TableHead className="text-right">Contracted</TableHead>
                      <TableHead className="text-right">Invoiced</TableHead>
                      <TableHead className="text-right">Collected</TableHead>
                      <TableHead className="text-right">Balance Due</TableHead>
                      <TableHead className="text-right">Unbilled WIP</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((c) => (
                      <TableRow key={c.customerId}>
                        <TableCell>
                          <div className="font-medium text-sm">{c.fullName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{c.customerCode}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>{c.city}</div>
                          <div className="text-muted-foreground">{c.systemSizeKw} kW</div>
                        </TableCell>
                        <TableCell className="text-right">
                          {c.contractValue !== null ? formatInr(c.contractValue) : <span className="text-xs text-muted-foreground">No quote</span>}
                        </TableCell>
                        <TableCell className="text-right">{formatInr(c.totalInvoiced)}</TableCell>
                        <TableCell className="text-right text-emerald-600">{formatInr(c.totalCollected)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          <span className={c.receivableBalance > 0 ? "text-amber-600" : "text-muted-foreground"}>
                            {formatInr(c.receivableBalance)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {c.unbilledContract !== null ? formatInr(c.unbilledContract) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => openNewInvoiceForCustomer(c.customerId)}
                          >
                            + Invoice
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVOICES TAB */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <CardTitle className="text-base">Customer Invoices &amp; Collections</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Search customer, invoice #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full sm:w-56 text-xs"
                />
                {["all", "installation", "amc", "repair", "service", "other"].map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={invoiceFilter === t ? "default" : "outline"}
                    className="h-8 text-xs capitalize"
                    onClick={() => setInvoiceFilter(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {isLoadingInvoices ? (
                <Skeleton className="h-40 w-full" />
              ) : filteredInvoices.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">No invoices match the current filters.</p>
                  <Button size="sm" onClick={() => openNewInvoiceForCustomer()}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Create First Invoice
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Invoiced</TableHead>
                      <TableHead className="text-right">Collected</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((inv: any) => {
                      const status = String(inv.status || inv.paymentStatus || "PENDING");
                      const outstanding = inv.outstanding ?? Math.max((inv.amount ?? 0) - (inv.amountPaid ?? 0), 0);
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-xs">{inv.invoiceNumber || inv.id.slice(0, 8)}</TableCell>
                          <TableCell className="font-medium text-sm">{inv.customer || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[11px]">{inv.invoiceType || "INSTALLATION"}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatInr(inv.amount)}</TableCell>
                          <TableCell className="text-right text-emerald-600">{formatInr(inv.amountPaid)}</TableCell>
                          <TableCell className="text-right font-medium">{formatInr(outstanding)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{inv.date}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                status === "PAID" ? "default" : status === "FAILED" || status === "CANCELLED" ? "destructive" : "secondary"
                              }
                            >
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {inv.proofUrl && (
                              <a
                                href={buildAssetUrlFromPath(inv.proofUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary underline"
                              >
                                Proof
                              </a>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                setPayModalInv(inv);
                                setPayAmountPaid(String(inv.amount ?? 0));
                                setPayStatus("paid");
                              }}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PURCHASES & PAYABLES (AP) TAB */}
        <TabsContent value="vendors" className="space-y-4">
          {/* AP Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-3.5">
              <p className="text-xs text-muted-foreground">Total Vendor Bills (Gross)</p>
              <p className="text-lg font-bold mt-1">{formatInr(vendorData?.summary.vendorBillsTotal)}</p>
              <p className="text-[11px] text-muted-foreground">{vendorBills.length} bills in register</p>
            </Card>
            <Card className="p-3.5">
              <p className="text-xs text-muted-foreground">Total Paid to Vendors</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">{formatInr(vendorData?.summary.vendorPaidTotal)}</p>
              <p className="text-[11px] text-muted-foreground">Including TDS settlements</p>
            </Card>
            <Card className="p-3.5 border-rose-500/20 bg-rose-500/5">
              <p className="text-xs text-muted-foreground">Outstanding Payables (AP)</p>
              <p className="text-lg font-bold text-rose-600 mt-1">{formatInr(vendorData?.summary.vendorOutstandingTotal)}</p>
              <p className="text-[11px] text-muted-foreground">{vendorData?.summary.openVendorBillCount ?? 0} open/partial bills</p>
            </Card>
            <Card className="p-3.5 border-amber-500/20 bg-amber-500/5">
              <p className="text-xs text-muted-foreground">Overdue Payables</p>
              <p className="text-lg font-bold text-amber-600 mt-1">{formatInr(vendorData?.summary.vendorOverdueTotal)}</p>
              <p className="text-[11px] text-muted-foreground">Past due date</p>
            </Card>
          </div>

          {/* 1. VENDOR BILL REGISTER */}
          <Card>
            <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Vendor Bill Register (Accounts Payable Lifecycle)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verify supplier GST invoices, track partial/full payments, and post directly to the Double-Entry Ledger
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Search bill #, invoice #, vendor..."
                  value={billSearch}
                  onChange={(e) => setBillSearch(e.target.value)}
                  className="h-8 w-full sm:w-52 text-xs"
                />
                {["ALL", "DRAFT", "AWAITING_APPROVAL", "APPROVED", "PARTIALLY_PAID", "PAID", "OVERDUE"].map((st) => (
                  <Button
                    key={st}
                    size="sm"
                    variant={billStatusFilter === st ? "default" : "outline"}
                    className="h-7 text-[11px]"
                    onClick={() => setBillStatusFilter(st)}
                  >
                    {st.replace("_", " ")}
                  </Button>
                ))}
                <Button size="sm" onClick={() => openNewBillForVendor()} className="h-8 gap-1">
                  <Plus className="w-3.5 h-3.5" /> New Vendor Bill
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {isLoadingBills ? (
                <Skeleton className="h-36 w-full" />
              ) : filteredVendorBills.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No vendor bills recorded yet. Click "+ New Vendor Bill" to record a supplier tax invoice.
                  </p>
                  <Button size="sm" onClick={() => openNewBillForVendor()}>
                    <FilePlus2 className="w-3.5 h-3.5 mr-1.5" /> Record First Vendor Bill
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill ID</TableHead>
                      <TableHead>Vendor &amp; Invoice #</TableHead>
                      <TableHead>Project / PO Ref</TableHead>
                      <TableHead>Invoice / Due</TableHead>
                      <TableHead className="text-right">Taxable + GST</TableHead>
                      <TableHead className="text-right">TDS</TableHead>
                      <TableHead className="text-right">Net Payable</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendorBills.map((bill) => {
                      const effStatus = bill.effectiveStatus || bill.status;
                      const gstSum = (bill.cgstAmount || 0) + (bill.sgstAmount || 0) + (bill.igstAmount || 0);
                      return (
                        <TableRow key={bill.id}>
                          <TableCell className="font-mono text-xs font-medium">{bill.billNumber}</TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{bill.vendor?.name || "Vendor"}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              Inv: {bill.vendorInvoiceNo}
                              {bill.vendor?.gstin ? ` · ${bill.vendor.gstin}` : ""}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div>{bill.customer ? `${bill.customer.fullName} (${bill.customer.customerCode})` : bill.zone || "General"}</div>
                            {bill.purchaseOrderRef && (
                              <div className="text-muted-foreground font-mono">PO: {bill.purchaseOrderRef}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div>{new Date(bill.invoiceDate).toLocaleDateString("en-IN")}</div>
                            <div className={bill.isOverdue ? "text-rose-600 font-medium" : "text-muted-foreground"}>
                              Due: {new Date(bill.dueDate).toLocaleDateString("en-IN")}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            <div>{formatInr(bill.totalAmount)}</div>
                            <div className="text-muted-foreground">GST: {formatInr(gstSum)}</div>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {bill.tdsAmount > 0 ? formatInr(bill.tdsAmount) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatInr(bill.netPayable)}</TableCell>
                          <TableCell className="text-right text-emerald-600">{formatInr(bill.amountPaid)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            <span className={bill.balanceDue > 0 ? "text-rose-600" : "text-muted-foreground"}>
                              {formatInr(bill.balanceDue)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                effStatus === "PAID"
                                  ? "default"
                                  : effStatus === "OVERDUE"
                                    ? "destructive"
                                    : effStatus === "PARTIALLY_PAID"
                                      ? "secondary"
                                      : "outline"
                              }
                            >
                              {effStatus.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-1 whitespace-nowrap">
                            {(bill.status === "DRAFT" || bill.status === "AWAITING_APPROVAL") && canViewCompanyPnl && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => handleApproveBill(bill.id)}
                                disabled={approveVendorBill.isPending}
                              >
                                Approve
                              </Button>
                            )}
                            {bill.status !== "DRAFT" &&
                              bill.status !== "AWAITING_APPROVAL" &&
                              bill.status !== "CANCELLED" &&
                              bill.balanceDue > 0.009 && (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => openRecordVendorPaymentModal(bill)}
                                >
                                  <CreditCard className="w-3 h-3" />
                                  Pay
                                </Button>
                              )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Edit Bill"
                              onClick={() => openEditBillModal(bill)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              title={bill.amountPaid > 0 ? "Cannot delete bill with recorded payments" : "Delete Bill"}
                              disabled={bill.amountPaid > 0}
                              onClick={() => setDeletingBill(bill)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* 2. VENDOR MASTER & LEDGER SUMMARY */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base">Vendor Master &amp; Accounts Payable Balances</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Auto-synced with Inventory stock-in suppliers plus registered EPC subcontractors and service vendors
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Search vendor, code, GSTIN..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="h-8 w-full sm:w-60 text-xs"
                />
                <Button size="sm" variant="outline" onClick={() => setVendorModalOpen(true)} className="h-8 gap-1">
                  <UserPlus className="w-3.5 h-3.5" /> Add Vendor
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {isLoadingVendorMaster ? (
                <Skeleton className="h-32 w-full" />
              ) : filteredVendorsMaster.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No vendors found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Type &amp; GSTIN</TableHead>
                      <TableHead className="text-right">Inventory Stock-In</TableHead>
                      <TableHead className="text-right">Total Billed</TableHead>
                      <TableHead className="text-right">Amount Paid</TableHead>
                      <TableHead className="text-right">AP Balance Due</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendorsMaster.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div className="font-medium text-sm">{v.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {v.vendorCode} · Terms: {v.paymentTermsDays}d
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>{v.vendorType.replace("_", " ")}</div>
                          <div className="text-muted-foreground font-mono">{v.gstin || "Unregistered / No GSTIN"}</div>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatInr(v.inventoryPurchaseValue)}
                        </TableCell>
                        <TableCell className="text-right">{formatInr(v.totalBilled)}</TableCell>
                        <TableCell className="text-right text-emerald-600">{formatInr(v.amountPaid)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          <span className={v.outstandingAmount > 0 ? "text-rose-600" : "text-muted-foreground"}>
                            {formatInr(v.outstandingAmount)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => openNewBillForVendor(v)}
                          >
                            + Bill
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* 3. OPERATIONAL & PROJECT EXPENSES (Separate from Vendor Bills) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Operational &amp; Site Expenses (Non-PO / Direct)</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kept separate from supplier purchase bills to prevent double-counting in AP
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={openNewExpenseModal} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Record Expense
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {(vendorData?.expenses ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No operational expenses recorded in this period.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(vendorData?.expenses ?? []).map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell className="font-medium">{exp.category}</TableCell>
                        <TableCell className="text-xs">{exp.zone || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(exp.expenseDate).toLocaleDateString("en-IN")}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{exp.notes || "—"}</TableCell>
                        <TableCell className="text-right font-semibold">{formatInr(exp.amount)}</TableCell>
                        <TableCell className="text-right space-x-1 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Edit Expense"
                            onClick={() => openEditExpenseModal(exp)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            title="Delete Expense"
                            onClick={() => setDeletingExpense(exp)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GENERAL LEDGER & GST TAB */}
        <TabsContent value="ledger" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Card className="p-3.5">
              <p className="text-xs text-muted-foreground">Total Debits (Trial Balance)</p>
              <p className="text-lg font-bold mt-1">{formatInr(glData?.summary.trialBalanceDebit)}</p>
            </Card>
            <Card className="p-3.5">
              <p className="text-xs text-muted-foreground">Total Credits (Trial Balance)</p>
              <p className="text-lg font-bold mt-1">{formatInr(glData?.summary.trialBalanceCredit)}</p>
            </Card>
            <Card className="p-3.5 border-emerald-500/20 bg-emerald-500/5">
              <p className="text-xs text-muted-foreground">Eligible Input GST (ITC)</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">{formatInr(glData?.summary.totalItcAvailable)}</p>
              <p className="text-[10px] text-muted-foreground">
                CGST: {formatInr(glData?.summary.inputCgst)} · SGST: {formatInr(glData?.summary.inputSgst)} · IGST: {formatInr(glData?.summary.inputIgst)}
              </p>
            </Card>
            <Card className="p-3.5">
              <p className="text-xs text-muted-foreground">TDS Payable (Statutory)</p>
              <p className="text-lg font-bold text-amber-600 mt-1">{formatInr(glData?.summary.tdsPayable)}</p>
              <p className="text-[10px] text-muted-foreground">Deducted on Vendor Bills / Payments</p>
            </Card>
            <Card className="p-3.5">
              <p className="text-xs text-muted-foreground">Double-Entry Integrity</p>
              <div className="mt-1.5">
                <Badge variant={glData?.summary.isBalanced !== false ? "default" : "destructive"}>
                  {glData?.summary.isBalanced !== false ? "BALANCED (Dr = Cr)" : "UNBALANCED"}
                </Badge>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Chart of Accounts &amp; Trial Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {isLoadingGl ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Net Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(glData?.trialBalance ?? []).map((acc) => (
                        <TableRow key={acc.id}>
                          <TableCell className="font-mono text-xs">{acc.code}</TableCell>
                          <TableCell className="font-medium text-xs">{acc.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{acc.accountType}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs">{formatInr(acc.totalDebit)}</TableCell>
                          <TableCell className="text-right text-xs">{formatInr(acc.totalCredit)}</TableCell>
                          <TableCell className="text-right font-semibold text-xs">{formatInr(acc.netBalance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Double-Entry Journal Postings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[520px] overflow-y-auto">
                {(glData?.journalEntries ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No journal entries posted yet. Approve a vendor bill, record a payment, or create an invoice to see automatic double-entry postings.
                  </p>
                ) : (
                  (glData?.journalEntries ?? []).map((je) => (
                    <div key={je.id} className="rounded-lg border p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-primary">{je.entryNumber}</span>
                        <span className="text-muted-foreground">
                          {new Date(je.entryDate).toLocaleDateString("en-IN")} · {je.referenceType}
                        </span>
                      </div>
                      <p className="font-medium">{je.description}</p>
                      <div className="border-t pt-1.5 space-y-1">
                        {je.lines.map((line) => (
                          <div key={line.id} className="flex items-center justify-between text-[11px]">
                            <span>
                              <span className="font-mono text-muted-foreground">{line.account.code}</span>{" "}
                              {line.account.name}
                            </span>
                            <span className="font-mono">
                              {line.debit > 0 ? `Dr ${formatInr(line.debit)}` : `Cr ${formatInr(line.credit)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PARTNER COMMISSIONS TAB */}
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Partner Commissions &amp; Payables</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {isLoadingPayouts ? (
                <Skeleton className="h-32 w-full" />
              ) : (payoutsData ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No partner payout records found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead className="text-right">Invoiced Value</TableHead>
                      <TableHead className="text-right">Paid Commission</TableHead>
                      <TableHead className="text-right">Pending Approved</TableHead>
                      <TableHead className="text-right">Unset Deals</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(payoutsData ?? []).map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.partnerName}</TableCell>
                        <TableCell className="text-muted-foreground">{p.businessName || "—"}</TableCell>
                        <TableCell className="text-right">{formatInr(p.totalInvoicedValue ?? p.totalProjectValue)}</TableCell>
                        <TableCell className="text-right text-emerald-600">{formatInr(p.earnedCommission)}</TableCell>
                        <TableCell className="text-right font-medium">{formatInr(p.pendingAmount)}</TableCell>
                        <TableCell className="text-right">{p.commissionNotSetCount ?? 0}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "completed" ? "default" : "secondary"}>{p.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ZONES TAB */}
        <TabsContent value="zones">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Zone-wise Invoiced Revenue</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {isLoadingZones ? (
                <Skeleton className="h-32 w-full" />
              ) : (zonesData ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No invoiced revenue recorded for any zone in this period.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zone</TableHead>
                      <TableHead className="text-right">Customers</TableHead>
                      <TableHead className="text-right">Invoiced Revenue</TableHead>
                      <TableHead className="text-right">Period Growth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(zonesData ?? []).map((z: any) => (
                      <TableRow key={z.zone}>
                        <TableCell className="font-medium">{z.zone}</TableCell>
                        <TableCell className="text-right">{z.customers}</TableCell>
                        <TableCell className="text-right">{formatInr(z.revenue)}</TableCell>
                        <TableCell className="text-right">
                          {z.growth === null || z.growth === undefined ? (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          ) : (
                            <span className={z.growth >= 0 ? "text-emerald-600" : "text-rose-600"}>
                              {z.growth >= 0 ? `+${z.growth}%` : `${z.growth}%`}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* P&L TAB */}
        <TabsContent value="pnl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Monthly P&amp;L (Invoiced Revenue vs. Verified Expenses &amp; Confirmed Payroll)
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {!canViewCompanyPnl ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Company-wide P&amp;L is restricted to Finance Manager, Finance Head, and Admin.
                </p>
              ) : isLoadingPnl ? (
                <Skeleton className="h-32 w-full" />
              ) : (pnlData ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No monthly P&amp;L entries available yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Invoiced Revenue</TableHead>
                      <TableHead className="text-right">Commissions</TableHead>
                      <TableHead className="text-right">Payroll</TableHead>
                      <TableHead className="text-right">Other Expenses</TableHead>
                      <TableHead className="text-right">Net Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(pnlData ?? []).map((row: any) => (
                      <TableRow key={row.monthKey || row.month}>
                        <TableCell className="font-medium">{row.month}</TableCell>
                        <TableCell className="text-right">{formatInr(row.revenue)}</TableCell>
                        <TableCell className="text-right">{formatInr(row.commissions)}</TableCell>
                        <TableCell className="text-right">{formatInr(row.salaries)}</TableCell>
                        <TableCell className="text-right">{formatInr(row.otherExpenses)}</TableCell>
                        <TableCell className={`text-right font-medium ${row.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {formatInr(row.profit)}
                        </TableCell>
                        <TableCell className="text-right">{row.margin}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ADD NEW VENDOR MASTER DIALOG */}
      <Dialog open={vendorModalOpen} onOpenChange={setVendorModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Vendor to Master</DialogTitle>
            <DialogDescription>
              Captures vendor GSTIN, PAN, bank details, payment terms, and default TDS applicability.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateVendorSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vendor / Supplier Name *</Label>
                <Input value={vName} onChange={(e) => setVName(e.target.value)} placeholder="e.g. Avanti Electricals Pvt Ltd" required />
              </div>
              <div>
                <Label>Vendor Type</Label>
                <Select value={vType} onValueChange={setVType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATERIAL_SUPPLIER">Material Supplier</SelectItem>
                    <SelectItem value="SUBCONTRACTOR">EPC Subcontractor</SelectItem>
                    <SelectItem value="SERVICE_PROVIDER">Service Provider</SelectItem>
                    <SelectItem value="TRANSPORTER">Transporter / Logistics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>GSTIN (15 chars, optional)</Label>
                <Input value={vGstin} onChange={(e) => setVGstin(e.target.value.toUpperCase())} placeholder="27AABCU9603R1ZM" maxLength={15} />
              </div>
              <div>
                <Label>PAN (10 chars, optional)</Label>
                <Input value={vPan} onChange={(e) => setVPan(e.target.value.toUpperCase())} placeholder="AABCU9603R" maxLength={10} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Contact Person</Label>
                <Input value={vContact} onChange={(e) => setVContact(e.target.value)} placeholder="Representative" />
              </div>
              <div>
                <Label>Mobile</Label>
                <Input value={vPhone} onChange={(e) => setVPhone(e.target.value)} placeholder="9876543210" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={vEmail} onChange={(e) => setVEmail(e.target.value)} placeholder="billing@vendor.in" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>State</Label>
                <Input value={vState} onChange={(e) => setVState(e.target.value)} placeholder="Maharashtra" />
              </div>
              <div>
                <Label>PIN Code</Label>
                <Input value={vPinCode} onChange={(e) => setVPinCode(e.target.value)} placeholder="440001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Bank Account Number</Label>
                <Input value={vBankAcc} onChange={(e) => setVBankAcc(e.target.value)} placeholder="001234567890" />
              </div>
              <div>
                <Label>IFSC Code</Label>
                <Input value={vIfsc} onChange={(e) => setVIfsc(e.target.value.toUpperCase())} placeholder="HDFC0001234" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Payment Terms (Days)</Label>
                <Select value={vTerms} onValueChange={setVTerms}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Immediate</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="15">15 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="45">45 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Opening Balance (₹)</Label>
                <Input type="number" step="0.01" value={vOpeningBal} onChange={(e) => setVOpeningBal(e.target.value)} />
              </div>
              <div>
                <Label>Default TDS %</Label>
                <Select
                  value={vTdsApplicable ? vTdsRate : "0"}
                  onValueChange={(val) => {
                    if (val === "0") {
                      setVTdsApplicable(false);
                      setVTdsRate("0");
                    } else {
                      setVTdsApplicable(true);
                      setVTdsRate(val);
                    }
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No TDS (0%)</SelectItem>
                    <SelectItem value="1">1% (194C Ind/HUF)</SelectItem>
                    <SelectItem value="2">2% (194C Co / 194J Tech)</SelectItem>
                    <SelectItem value="10">10% (194J Prof / 194I Rent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setVendorModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createVendor.isPending}>
                {createVendor.isPending ? "Saving..." : "Save Vendor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VENDOR BILL DIALOG (CREATE & EDIT) */}
      <Dialog
        open={billModalOpen}
        onOpenChange={(o) => {
          setBillModalOpen(o);
          if (!o) setEditingBill(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBill ? `Edit Vendor Bill (${editingBill.billNumber})` : "Record Vendor Bill (Supplier Tax Invoice)"}
            </DialogTitle>
            <DialogDescription>
              {editingBill
                ? "Update supplier invoice details, line items, taxes, or references. Double-entry ledger entries will automatically re-sync."
                : "Verifies HSN/SAC, quantity, rate, CGST/SGST or IGST, and TDS, and posts balanced entries to Accounts Payable."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVendorBillFormSubmit} className="space-y-4 text-xs">
            {/* Section 1: Vendor & Invoice Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Vendor *</Label>
                <Select
                  value={bVendorId}
                  onValueChange={(val) => {
                    setBVendorId(val);
                    const found = vendorsMaster.find((x) => x.id === val);
                    if (found) {
                      setBTdsRate(found.tdsApplicable ? String(found.defaultTdsRate || 2) : "0");
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>
                    {vendorsMaster.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} ({v.vendorCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vendor Invoice No. *</Label>
                <Input value={bInvoiceNo} onChange={(e) => setBInvoiceNo(e.target.value)} placeholder="e.g. GST/26-27/0104" required />
              </div>
              <div>
                <Label>Bill Category</Label>
                <Select value={bCategory} onValueChange={setBCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Material Purchase">Solar Panels / Material Purchase</SelectItem>
                    <SelectItem value="Subcontractor RA Bill">Subcontractor RA / Installation Bill</SelectItem>
                    <SelectItem value="Electrical & Cables">Electrical &amp; Balance of System</SelectItem>
                    <SelectItem value="Transport & Crane">Transport &amp; Logistics</SelectItem>
                    <SelectItem value="Other Service">Other Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label>Invoice Date</Label>
                <Input type="date" value={bInvoiceDate} onChange={(e) => setBInvoiceDate(e.target.value)} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={bDueDate} onChange={(e) => setBDueDate(e.target.value)} />
              </div>
              <div>
                <Label>PO Ref (optional)</Label>
                <Input value={bPoRef} onChange={(e) => setBPoRef(e.target.value)} placeholder="PO-2026-012" />
              </div>
              <div>
                <Label>GRN / Work Cert Ref</Label>
                <Input value={bGrnRef} onChange={(e) => setBGrnRef(e.target.value)} placeholder="GRN-088" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Link to Customer Project (optional)</Label>
                <Select value={bCustomerId} onValueChange={setBCustomerId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General / Warehouse Stock</SelectItem>
                    {customersList.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.fullName} ({c.customerCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>GST Supply Type</Label>
                <Select value={bSupplyType} onValueChange={(v) => setBSupplyType(v as "INTRA_STATE" | "INTER_STATE")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTRA_STATE">Intra-State (CGST + SGST)</SelectItem>
                    <SelectItem value="INTER_STATE">Inter-State (IGST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Zone / Site</Label>
                <Input value={bZone} onChange={(e) => setBZone(e.target.value)} placeholder="e.g. Nagpur / Pune" />
              </div>
            </div>

            {/* Section 2: Product / Service Line Items */}
            <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Line Items (HSN/SAC, Qty, Rate &amp; GST)</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() =>
                    setBItems((prev) => [
                      ...prev,
                      { itemName: "", hsnSac: "8541", quantity: 1, unit: "nos", rate: 0, discountPct: 0, gstRate: 18 },
                    ])
                  }
                >
                  + Add Line
                </Button>
              </div>

              {bItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end border-b pb-2">
                  <div className="col-span-4">
                    <Label className="text-[10px]">Item / Description</Label>
                    <Input
                      value={item.itemName}
                      onChange={(e) =>
                        setBItems((prev) => prev.map((r, i) => (i === idx ? { ...r, itemName: e.target.value } : r)))
                      }
                      placeholder="Solar DC Cable / Panel"
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px]">HSN/SAC</Label>
                    <Input
                      value={item.hsnSac ?? ""}
                      onChange={(e) =>
                        setBItems((prev) => prev.map((r, i) => (i === idx ? { ...r, hsnSac: e.target.value } : r)))
                      }
                      placeholder="8544"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-[10px]">Qty</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="any"
                      value={item.quantity}
                      onChange={(e) =>
                        setBItems((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, quantity: Number(e.target.value) } : r))
                        )
                      }
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px]">Rate (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={item.rate}
                      onChange={(e) =>
                        setBItems((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, rate: Number(e.target.value) } : r))
                        )
                      }
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px]">GST %</Label>
                    <Select
                      value={String(item.gstRate ?? 18)}
                      onValueChange={(val) =>
                        setBItems((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, gstRate: Number(val) } : r))
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {bItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-rose-500"
                        onClick={() => setBItems((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Section 3: Tax, TDS & Posting Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <Label>Freight / Other Charges (₹)</Label>
                <Input type="number" min="0" step="0.01" value={bOtherCharges} onChange={(e) => setBOtherCharges(e.target.value)} />
              </div>
              <div>
                <Label>TDS Deduction % (on Taxable)</Label>
                <Select value={bTdsRate} onValueChange={setBTdsRate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (No TDS)</SelectItem>
                    <SelectItem value="1">1% (Sec 194C Ind)</SelectItem>
                    <SelectItem value="2">2% (Sec 194C / 194J)</SelectItem>
                    <SelectItem value="5">5% (Sec 194H Commission)</SelectItem>
                    <SelectItem value="10">10% (Sec 194J / 194I)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>GST Input Tax Credit (ITC)</Label>
                <Select value={bItcEligible ? "yes" : "no"} onValueChange={(v) => setBItcEligible(v === "yes")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Eligible for ITC</SelectItem>
                    <SelectItem value="no">Ineligible (Add to Cost)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Posting Action</Label>
                <Select value={bSubmitMode} onValueChange={(v) => setBSubmitMode(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Save as Open Bill (Post GL)</SelectItem>
                    <SelectItem value="AWAITING_APPROVAL">Submit for Approval</SelectItem>
                    <SelectItem value="DRAFT">Save as Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live Bill Summary Card */}
            <div className="rounded-lg border bg-card p-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground block">Taxable Value</span>
                <span className="font-semibold">{formatInr(liveBillCalc.taxableAmount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">
                  {bSupplyType === "INTER_STATE" ? "IGST" : "CGST + SGST"}
                </span>
                <span className="font-semibold">
                  {bSupplyType === "INTER_STATE"
                    ? formatInr(liveBillCalc.igstAmount)
                    : `${formatInr(liveBillCalc.cgstAmount)} + ${formatInr(liveBillCalc.sgstAmount)}`}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Gross Invoice Total</span>
                <span className="font-semibold">{formatInr(liveBillCalc.totalAmount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Less: TDS Payable</span>
                <span className="font-semibold text-amber-600">-{formatInr(liveBillCalc.tdsAmount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Net Payable to Vendor</span>
                <span className="font-bold text-primary text-sm">{formatInr(liveBillCalc.netPayable)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBillModalOpen(false);
                  setEditingBill(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editingBill ? updateVendorBill.isPending : createVendorBill.isPending}
              >
                {editingBill
                  ? updateVendorBill.isPending
                    ? "Updating..."
                    : "Update Vendor Bill"
                  : createVendorBill.isPending
                    ? "Recording..."
                    : "Save Vendor Bill"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE VENDOR BILL CONFIRMATION DIALOG */}
      <Dialog open={!!deletingBill} onOpenChange={(open) => !open && setDeletingBill(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" /> Delete Vendor Bill
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete vendor bill{" "}
              <strong className="text-foreground">{deletingBill?.billNumber}</strong>?
            </DialogDescription>
          </DialogHeader>
          {deletingBill && (
            <div className="space-y-3 text-xs bg-muted/40 p-3 rounded-lg border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor:</span>
                <span className="font-medium">{deletingBill.vendor?.name || "Vendor"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice #:</span>
                <span className="font-mono">{deletingBill.vendorInvoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total / Net Payable:</span>
                <span className="font-semibold">{formatInr(deletingBill.netPayable)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline">{deletingBill.status}</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1 border-t">
                This will permanently delete this bill, all associated line items, and remove any corresponding double-entry journal postings from the General Ledger.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingBill(null)}
              disabled={deleteVendorBill.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteBillSubmit}
              disabled={deleteVendorBill.isPending}
            >
              {deleteVendorBill.isPending ? "Deleting..." : "Delete Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RECORD VENDOR PAYMENT DIALOG (Partial / Full Payment Lifecycle) */}
      <Dialog open={!!vendorPayBill} onOpenChange={(o) => !o && setVendorPayBill(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Vendor Payment</DialogTitle>
            <DialogDescription>
              {vendorPayBill?.vendor?.name} · Bill {vendorPayBill?.billNumber} (Inv #{vendorPayBill?.vendorInvoiceNo})
            </DialogDescription>
          </DialogHeader>
          {vendorPayBill && (
            <form onSubmit={handleRecordVendorPaymentSubmit} className="space-y-3 text-xs">
              <div className="rounded-lg border p-3 bg-muted/30 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Net Payable:</span>
                  <span className="font-semibold">{formatInr(vendorPayBill.netPayable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Already Paid:</span>
                  <span className="font-semibold text-emerald-600">{formatInr(vendorPayBill.amountPaid)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-medium">Outstanding Balance Due:</span>
                  <span className="font-bold text-rose-600">{formatInr(vendorPayBill.balanceDue)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Payment Amount (₹) *</Label>
                  <Input
                    type="number"
                    min="1"
                    max={vendorPayBill.balanceDue}
                    step="0.01"
                    value={vpAmount}
                    onChange={(e) => setVpAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Payment Mode</Label>
                  <Select value={vpMode} onValueChange={setVpMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEFT">NEFT / RTGS</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="IMPS">IMPS</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>UTR / Cheque / Ref No.</Label>
                  <Input
                    value={vpRefNo}
                    onChange={(e) => setVpRefNo(e.target.value)}
                    placeholder="UTR / Cheque #"
                  />
                </div>
                <div>
                  <Label>Payment Date</Label>
                  <Input type="date" value={vpDate} onChange={(e) => setVpDate(e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Remarks</Label>
                <Input
                  value={vpNotes}
                  onChange={(e) => setVpNotes(e.target.value)}
                  placeholder="e.g. Partial milestone release / full settlement"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setVendorPayBill(null)}>Cancel</Button>
                <Button type="submit" disabled={recordVendorPayment.isPending}>
                  {recordVendorPayment.isPending ? "Recording..." : "Record Payment & Post GL"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE CUSTOMER INVOICE DIALOG */}
      <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Customer Invoice</DialogTitle>
            <DialogDescription>Creates a milestone or service invoice linked to the customer ledger and Double-Entry GL.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoiceSubmit} className="space-y-3">
            <div>
              <Label>Customer</Label>
              <Select value={invCustomerId} onValueChange={setInvCustomerId}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customersList.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.fullName} ({c.customerCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={invType} onValueChange={setInvType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="amc">AMC</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (₹)</Label>
                <Input type="number" min="1" step="0.01" value={invAmount} onChange={(e) => setInvAmount(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Invoice # (optional)</Label>
                <Input value={invNumber} onChange={(e) => setInvNumber(e.target.value)} placeholder="INV-2026-001" />
              </div>
              <div>
                <Label>Invoice Date</Label>
                <Input type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Initial Status</Label>
                <Select value={invStatus} onValueChange={setInvStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={invMethod} onValueChange={setInvMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer / NEFT</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Milestone / Description</Label>
              <Input value={invDesc} onChange={(e) => setInvDesc(e.target.value)} placeholder="e.g. Advance / Material Dispatch / Commissioning" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInvoiceModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createInvoice.isPending}>
                {createInvoice.isPending ? "Saving..." : "Create Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* UPDATE / RECORD CUSTOMER PAYMENT DIALOG */}
      <Dialog open={!!payModalInv} onOpenChange={(o) => !o && setPayModalInv(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Collection / Update Status</DialogTitle>
            <DialogDescription>
              {payModalInv?.customer} · Invoiced: {formatInr(payModalInv?.amount)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-3">
            <div>
              <Label>Amount Collected (₹)</Label>
              <Input
                type="number"
                min="0"
                max={payModalInv?.amount ?? undefined}
                step="0.01"
                value={payAmountPaid}
                onChange={(e) => setPayAmountPaid(e.target.value)}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={payStatus} onValueChange={setPayStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending (Partial)</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayModalInv(null)}>Cancel</Button>
              <Button type="submit" disabled={updateInvoice.isPending}>
                {updateInvoice.isPending ? "Updating..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* RECORD / EDIT EXPENSE DIALOG */}
      <Dialog
        open={expenseModalOpen}
        onOpenChange={(o) => {
          setExpenseModalOpen(o);
          if (!o) setEditingExpense(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit Operational / Project Expense" : "Record Operational / Project Expense"}
            </DialogTitle>
            <DialogDescription>
              {editingExpense
                ? "Update expense details. Double-entry General Ledger postings will automatically re-sync."
                : "Logs an operational expense into the Expense ledger & Double-Entry GL."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleExpenseFormSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={expCategory} onValueChange={setExpCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Site Logistics">Site Logistics</SelectItem>
                    <SelectItem value="Installation Labour">Installation Labour</SelectItem>
                    <SelectItem value="Liaisoning & DISCOM">Liaisoning &amp; DISCOM</SelectItem>
                    <SelectItem value="Travel & Conveyance">Travel &amp; Conveyance</SelectItem>
                    <SelectItem value="Office & Admin">Office &amp; Admin</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (₹)</Label>
                <Input type="number" min="1" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
              </div>
              <div>
                <Label>Zone / City (optional)</Label>
                <Input value={expZone} onChange={(e) => setExpZone(e.target.value)} placeholder="e.g. Nagpur" />
              </div>
            </div>
            <div>
              <Label>Notes / Reference</Label>
              <Input value={expNotes} onChange={(e) => setExpNotes(e.target.value)} placeholder="Receipt #, site name, or petty cash ref" />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setExpenseModalOpen(false);
                  setEditingExpense(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editingExpense ? updateExpense.isPending : createExpense.isPending}
              >
                {editingExpense
                  ? updateExpense.isPending
                    ? "Updating..."
                    : "Update Expense"
                  : createExpense.isPending
                    ? "Saving..."
                    : "Record Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE EXPENSE CONFIRMATION DIALOG */}
      <Dialog open={!!deletingExpense} onOpenChange={(open) => !open && setDeletingExpense(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" /> Delete Expense
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this{" "}
              <strong className="text-foreground">{deletingExpense?.category}</strong> expense?
            </DialogDescription>
          </DialogHeader>
          {deletingExpense && (
            <div className="space-y-3 text-xs bg-muted/40 p-3 rounded-lg border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium">{deletingExpense.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{new Date(deletingExpense.expenseDate).toLocaleDateString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">{formatInr(deletingExpense.amount)}</span>
              </div>
              {deletingExpense.notes && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Notes:</span>
                  <span>{deletingExpense.notes}</span>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground pt-1 border-t">
                This will permanently delete this expense and remove its corresponding double-entry journal posting from the General Ledger.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingExpense(null)}
              disabled={deleteExpense.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteExpenseSubmit}
              disabled={deleteExpense.isPending}
            >
              {deleteExpense.isPending ? "Deleting..." : "Delete Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
