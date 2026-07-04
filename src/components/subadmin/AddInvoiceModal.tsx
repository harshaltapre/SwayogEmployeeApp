import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateInvoice, useListCustomers, CreateInvoiceInput } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().min(1, "Receipt Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  status: z.string().default("pending"),
  paymentMethod: z.string().default("online"),
  invoiceType: z.string().default("amc"),
  invoiceNumber: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface AddInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCustomerId?: string;
}

export function AddInvoiceModal({ open, onOpenChange, defaultCustomerId }: AddInvoiceModalProps) {
  const { toast } = useToast();
  const createMutation = useCreateInvoice();
  const queryClient = useQueryClient();
  const { data: customers = [] } = useListCustomers();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: defaultCustomerId || "",
      description: "",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      status: "pending",
      paymentMethod: "online",
      invoiceType: "amc",
      invoiceNumber: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        customerId: defaultCustomerId || "",
        description: "",
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        status: "pending",
        paymentMethod: "online",
        invoiceType: "amc",
        invoiceNumber: "",
      });
    }
  }, [open, defaultCustomerId, form]);

  const onSubmit = (values: InvoiceFormValues) => {
    const proofFile = (form as any)._proofFile;
    createMutation.mutate({ data: values as CreateInvoiceInput, proof: proofFile }, {
      onSuccess: () => {
        toast({ title: "Invoice Created", description: "Payment record has been logged successfully." });
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
        onOpenChange(false);
        form.reset({
          customerId: defaultCustomerId || "",
          description: "",
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          status: "pending",
          paymentMethod: "online",
          invoiceType: "amc",
          invoiceNumber: "",
        });
        delete (form as any)._proofFile;
      },
      onError: (err) => {
        toast({ title: "Creation Failed", description: err instanceof Error ? err.message : "Error creating invoice", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log New AMC Payment</DialogTitle>
          <DialogDescription>Create a new payment record for AMC services</DialogDescription>
        </DialogHeader>
 
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!!defaultCustomerId} // Disable changing if a default is provided
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. AMC Quarter 1 Payment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. INV-2026-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Proof of Payment (Optional)</Label>
              <Input 
                type="file" 
                accept=".jpg,.jpeg,.png,.pdf" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    (form as any)._proofFile = file;
                  }
                }}
              />
              <p className="text-[0.75rem] text-muted-foreground">Upload a photo or PDF as proof of work/payment.</p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Log Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
