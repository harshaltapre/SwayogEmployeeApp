import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CustomerRecord, useUpdateAmcSettings, useListEmployees, getListTasksQueryKey } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

const amcSettingsSchema = z.object({
  clientType: z.string(),
  consumerNumber: z.string().optional(),
  monthlyCleaningRate: z.coerce.number().min(0),
  cleaningsPerMonth: z.coerce.number().min(1).max(8),
  cleaningWindow1: z.string().default("1-10"),
  cleaningWindow2: z.string().optional().default("11-20"),
  cleaningWindow3: z.string().optional().default("21-30"),
  cleaningWindow4: z.string().optional(),
  cleaningWindow5: z.string().optional(),
  cleaningWindow6: z.string().optional(),
  cleaningWindow7: z.string().optional(),
  cleaningWindow8: z.string().optional(),
  contractStartDate: z.string().min(1, "Start date is required"),
  contractEndDate: z.string().min(1, "End date is required"),
  paymentTerms: z.string().optional(),
  remarks: z.string().optional(),
  assignedEmployeeId: z.string().optional(),
});

type AmcSettingsFormValues = z.infer<typeof amcSettingsSchema>;

interface AmcSettingsModalProps {
  customer: CustomerRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AmcSettingsModal({ customer, open, onOpenChange }: AmcSettingsModalProps) {
  const { toast } = useToast();
  const updateMutation = useUpdateAmcSettings();
  const queryClient = useQueryClient();
  const { data: employees = [] } = useListEmployees();

  const filteredEmployees = employees.filter(e => 
    ["Electrical Engineer", "Site Survey Engineer", "O&M Technician", "Service Engineer", "Field Technician", "Technician"].includes(e.role)
  );

  const form = useForm<AmcSettingsFormValues>({
    resolver: zodResolver(amcSettingsSchema),
    defaultValues: {
      clientType: customer.clientType || "post_paid",
      consumerNumber: customer.consumerNumber || "",
      monthlyCleaningRate: customer.monthlyCleaningRate || 0,
      cleaningsPerMonth: customer.cleaningsPerMonth || 1,
      cleaningWindow1: customer.cleaningWindow1 || "1-10",
      cleaningWindow2: customer.cleaningWindow2 || "11-20",
      cleaningWindow3: customer.cleaningWindow3 || "21-30",
      cleaningWindow4: customer.cleaningWindow4 || "",
      cleaningWindow5: customer.cleaningWindow5 || "",
      cleaningWindow6: customer.cleaningWindow6 || "",
      cleaningWindow7: customer.cleaningWindow7 || "",
      cleaningWindow8: customer.cleaningWindow8 || "",
      contractStartDate: customer.contractStartDate ? format(new Date(customer.contractStartDate), "yyyy-MM-dd") : "",
      contractEndDate: customer.contractEndDate ? format(new Date(customer.contractEndDate), "yyyy-MM-dd") : "",
      paymentTerms: customer.paymentTerms || "",
      remarks: customer.remarks || "",
      assignedEmployeeId: customer.assignedEmployeeId || "",
    },
  });

  // Reset form when customer changes or modal opens
  React.useEffect(() => {
    if (open) {
      form.reset({
        clientType: customer.clientType || "post_paid",
        consumerNumber: customer.consumerNumber || "",
        monthlyCleaningRate: customer.monthlyCleaningRate || 0,
        cleaningsPerMonth: customer.cleaningsPerMonth || 1,
        cleaningWindow1: customer.cleaningWindow1 || "1-10",
        cleaningWindow2: customer.cleaningWindow2 || "11-20",
        cleaningWindow3: customer.cleaningWindow3 || "21-30",
        cleaningWindow4: customer.cleaningWindow4 || "",
        cleaningWindow5: customer.cleaningWindow5 || "",
        cleaningWindow6: customer.cleaningWindow6 || "",
        cleaningWindow7: customer.cleaningWindow7 || "",
        cleaningWindow8: customer.cleaningWindow8 || "",
        contractStartDate: customer.contractStartDate ? format(new Date(customer.contractStartDate), "yyyy-MM-dd") : "",
        contractEndDate: customer.contractEndDate ? format(new Date(customer.contractEndDate), "yyyy-MM-dd") : "",
        paymentTerms: customer.paymentTerms || "",
        remarks: customer.remarks || "",
        assignedEmployeeId: customer.assignedEmployeeId || "",
      });
    }
  }, [customer, open, form]);

  const onSubmit = (values: AmcSettingsFormValues) => {
    updateMutation.mutate({
      customerId: customer.id,
      data: values,
    }, {
      onSuccess: () => {
        toast({ title: "AMC Settings Updated", description: `Configuration for ${customer.name} saved successfully.` });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        onOpenChange(false);
      },
      onError: (err) => {
        toast({ title: "Update Failed", description: err instanceof Error ? err.message : "Error saving settings", variant: "destructive" });
      }
    });
  };

  const cleaningsCount = form.watch("cleaningsPerMonth");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AMC Settings: {customer.name}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="post_paid">Post Paid</SelectItem>
                        <SelectItem value="pre_paid">Pre Paid</SelectItem>
                        <SelectItem value="on_call">On Call</SelectItem>
                        <SelectItem value="free_service">Free Service</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="consumerNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumer Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter consumer ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">

              <FormField
                control={form.control}
                name="cleaningsPerMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cleanings Per Month</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select count" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                          <SelectItem key={count} value={String(count)}>{count} Visits</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
              <Label className="text-sm font-semibold">Cleaning Slots (Date Windows)</Label>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <React.Fragment key={i}>
                    {cleaningsCount >= i && (
                      <FormField
                        control={form.control}
                        name={`cleaningWindow${i}` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Slot {i}</FormLabel>
                            <FormControl>
                              <Input placeholder={`${(i - 1) * 3 + 1}-${i * 3 + 2}`} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 italic">Visits will be auto-generated at the midpoint of each window.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contractStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract End Date</FormLabel>
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
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Quarterly in advance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedEmployeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Employee (Technician)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select technician" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No specific assignment</SelectItem>
                        {filteredEmployees.map(emp => (
                          <SelectItem key={emp.id} value={String(emp.userId || emp.id)}>{emp.name} ({emp.role})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Special instructions..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Generating Schedule..." : "Save & Generate Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
