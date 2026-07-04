import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useListInvoices } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { AddInvoiceModal } from "./AddInvoiceModal";

interface CustomerPaymentsModalProps {
  customerId: string;
  customerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerPaymentsModal({ customerId, customerName, open, onOpenChange }: CustomerPaymentsModalProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Fetch invoices for this specific customer
  const { data: invoicesData, isLoading } = useListInvoices(customerId, { query: { invoiceType: "amc" } });
  const invoices = invoicesData ?? [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>{customerName} - Payment Details</DialogTitle>
            <DialogDescription>View and manage payment records for this customer</DialogDescription>
            <Button 
              size="sm" 
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Add Payment
            </Button>
          </DialogHeader>

          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Receipt Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="text-center py-4">
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                      No payment records found for this customer.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        {inv.invoiceNumber ? (
                          <div className="font-semibold text-blue-700 text-sm">{inv.invoiceNumber}</div>
                        ) : (
                          <div className="text-slate-300 text-sm font-medium">—</div>
                        )}
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5">#{inv.id.substring(0, 8)}</div>
                        <Badge variant="outline" className="mt-1 text-[9px] uppercase px-1.5 py-0 h-4">
                          {inv.invoiceType || "service"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{inv.date}</TableCell>
                      <TableCell className="text-sm">{inv.description || "Service Task"}</TableCell>
                      <TableCell className="text-sm capitalize">{inv.paymentMethod || "N/A"}</TableCell>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <AddInvoiceModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen}
        defaultCustomerId={customerId}
      />
    </>
  );
}
