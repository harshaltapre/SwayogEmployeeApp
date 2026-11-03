import { useState, useMemo } from "react";
import { 
  Plus, Filter, Receipt, Search, Eye
} from "lucide-react";
import { SubAdminLayout } from "@/components/subadmin/SubAdminLayout";
import { PageHeader } from "@/components/PageHeader";
import { 
  useListInvoices, 
} from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AddInvoiceModal } from "@/components/subadmin/AddInvoiceModal";
import { CustomerPaymentsModal } from "@/components/subadmin/CustomerPaymentsModal";

export default function SubAdminFinancials() {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");

  const { data: invoicesData, isLoading: isLoadingInvoices } = useListInvoices(undefined, { query: { invoiceType: "amc" } });
  const invoices = invoicesData ?? [];

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const lowerQuery = searchQuery.toLowerCase();
    return invoices.filter((inv: any) => 
      (inv.customer && inv.customer.toLowerCase().includes(lowerQuery)) ||
      (inv.id && inv.id.toLowerCase().includes(lowerQuery)) ||
      (inv.description && inv.description.toLowerCase().includes(lowerQuery))
    );
  }, [invoices, searchQuery]);

  return (
    <SubAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <PageHeader
            title="AMC Financial Management"
            description="Manage customer AMC rates and log payment records for Superadmin reporting."
          />
          <Button 
            onClick={() => setIsInvoiceModalOpen(true)}
            className="bg-slate-900 text-white hover:bg-slate-800 gap-2"
          >
            <Plus className="h-4 w-4" />
            Log New Payment
          </Button>
        </div>

        <Card className="shadow-sm border-slate-200 mt-6">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment Records
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search invoices..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="sm" variant="outline"><Filter className="h-4 w-4 mr-2" />Filter</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingInvoices ? (
                  [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={7} className="text-center py-4"><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                ) : filteredInvoices.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-500">No payment records found.</TableCell></TableRow>
                ) : filteredInvoices.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs text-slate-500">
                      #{inv.id.substring(0, 8)}
                    </TableCell>
                    <TableCell className="text-sm">{inv.date}</TableCell>
                    <TableCell className="font-medium">{inv.customer || "N/A"}</TableCell>
                    <TableCell className="text-sm">{inv.description || "AMC Service"}</TableCell>
                    <TableCell className="text-right font-bold">
                      ₹{Number(inv.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                        inv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {inv.status?.toUpperCase() || "PENDING"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                        onClick={() => {
                          setSelectedCustomerId(String(inv.customerId));
                          setSelectedCustomerName(inv.customer || "Unknown Customer");
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {selectedCustomerId && (
        <CustomerPaymentsModal
          customerId={selectedCustomerId}
          customerName={selectedCustomerName}
          open={!!selectedCustomerId}
          onOpenChange={(open) => !open && setSelectedCustomerId(null)}
        />
      )}

      <AddInvoiceModal 
        open={isInvoiceModalOpen}
        onOpenChange={setIsInvoiceModalOpen}
      />
    </SubAdminLayout>
  );
}
