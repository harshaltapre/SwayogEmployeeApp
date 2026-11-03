import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  
  // Fetch only AMC invoices for this specific customer
  const { data: invoicesData, isLoading } = useListInvoices(customerId, { query: { invoiceType: "amc" } });
  const invoices = invoicesData ?? [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>{customerName} - Payment Details</DialogTitle>
            <Button 
              size="sm" 
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Add Payment
            </Button>
          </DialogHeader>

          <div className="mt-4">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="text-center py-4">
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                      No payment records found for this customer.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs text-slate-500">
                        #{inv.id.substring(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm">{inv.date}</TableCell>
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
