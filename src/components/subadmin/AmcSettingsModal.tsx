import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";

const TIME_SLOT_OPTIONS = [
  { label: "07:00 AM", value: "07:00" },
  { label: "08:00 AM", value: "08:00" },
  { label: "09:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "11:00 AM", value: "11:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "01:00 PM", value: "13:00" },
  { label: "02:00 PM", value: "14:00" },
  { label: "03:00 PM", value: "15:00" },
  { label: "04:00 PM", value: "16:00" },
  { label: "05:00 PM", value: "17:00" },
  { label: "06:00 PM", value: "18:00" },
];

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
  nextSurveyDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  remarks: z.string().optional(),
  assignedEmployeeId: z.string().optional(),
  useVariableTiming: z.boolean().default(false),
  cleaningTimeSlot1: z.string().default("09:00"),
  cleaningTimeSlot2: z.string().default("09:00"),
  cleaningTimeSlot3: z.string().default("09:00"),
  cleaningTimeSlot4: z.string().default("09:00"),
  scheduleMonth: z.string().min(7, "Please select a month"),
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
    [
      "electrical engineer", "electrical_engineer", 
      "site survey engineer", "site_survey_engineer", 
      "o&m technician", "om_technician", 
      "service engineer", "service_engineer", 
      "field technician", "field_technician", 
      "technician", "intern", "employee"
    ].includes(String(e.role || "").toLowerCase())
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
      nextSurveyDate: "",
      paymentTerms: customer.paymentTerms || "",
      remarks: customer.remarks || "",
      assignedEmployeeId: customer.assignedEmployeeId || "",
      useVariableTiming: false,
      cleaningTimeSlot1: "09:00",
      cleaningTimeSlot2: "09:00",
      cleaningTimeSlot3: "09:00",
      cleaningTimeSlot4: "09:00",
      scheduleMonth: format(new Date(), "yyyy-MM"),
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
        nextSurveyDate: "",
        paymentTerms: customer.paymentTerms || "",
        remarks: customer.remarks || "",
        assignedEmployeeId: customer.assignedEmployeeId || "",
        useVariableTiming: false,
        cleaningTimeSlot1: "09:00",
        cleaningTimeSlot2: "09:00",
        cleaningTimeSlot3: "09:00",
        cleaningTimeSlot4: "09:00",
        scheduleMonth: format(new Date(), "yyyy-MM"),
      });
    }
  }, [customer, open, form]);

  const onSubmit = (values: AmcSettingsFormValues) => {
    const payload = {
      ...values,
      assignedEmployeeId: values.assignedEmployeeId && values.assignedEmployeeId !== "none" ? values.assignedEmployeeId : null,
      nextSurveyDate: values.nextSurveyDate || undefined,
    };

    updateMutation.mutate({
      customerId: customer.id,
      data: payload,
    }, {
      onSuccess: () => {
        toast({ title: "AMC Settings Updated", description: `Configuration for ${customer.name} saved successfully.` });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        onOpenChange(false);
      },
      onError: (err: any) => {
        const errMsg = err?.error || err?.message || (err instanceof Error ? err.message : "Error saving settings");
        toast({ title: "Update Failed", description: errMsg, variant: "destructive" });
      }
    });
  };

  const cleaningsCount = form.watch("cleaningsPerMonth");
  const useVariableTiming = form.watch("useVariableTiming");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AMC Settings: {customer.name}</DialogTitle>
          <DialogDescription>Configure AMC settings, payment terms, and cleaning schedules</DialogDescription>
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
                name="scheduleMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Month & Year</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
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

              <FormField
                control={form.control}
                name="monthlyCleaningRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Cleaning Rate (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Enter monthly rate"
                        {...field}
                      />
                    </FormControl>
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

            {/* Read-only Contract Duration Badge */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-100 border border-slate-200 rounded-lg justify-between items-start sm:items-center">
              <div>
                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Contract Duration (Read-only)</span>
                <div className="text-sm font-semibold text-slate-800 mt-0.5">
                  {customer.contractStartDate ? format(new Date(customer.contractStartDate), "dd MMM yyyy") : "N/A"} to{" "}
                  {customer.contractEndDate ? format(new Date(customer.contractEndDate), "dd MMM yyyy") : "N/A"}
                </div>
              </div>
              <div className="bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-full shrink-0">
                {customer.cleaningsPerMonth || 2} Cleanings / Month
              </div>
            </div>

            {/* Visit Timing Configuration */}
            <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
              <Label className="text-sm font-semibold text-slate-800">Visit Timing Settings</Label>
              
              <FormField
                control={form.control}
                name="useVariableTiming"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 bg-white">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-xs font-semibold cursor-pointer">Different time per cleaning visit</FormLabel>
                      <p className="text-[10px] text-slate-500">Enable if you want to assign separate timing slots for each monthly cleaning visit.</p>
                    </div>
                  </FormItem>
                )}
              />

              {!useVariableTiming ? (
                <FormField
                  control={form.control}
                  name="cleaningTimeSlot1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Preferred Cleaning Time Slot (All Visits)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timing" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_SLOT_OPTIONS.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="grid grid-cols-2 gap-4 pt-1">
                  {[1, 2, 3, 4].map((i) => (
                    <React.Fragment key={i}>
                      {cleaningsCount >= i && (
                        <FormField
                          control={form.control}
                          name={`cleaningTimeSlot${i}` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium">Visit #{i} Time Slot</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Select timing" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TIME_SLOT_OPTIONS.map((slot) => (
                                    <SelectItem key={slot.value} value={slot.value} className="text-xs">{slot.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nextSurveyDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Survey Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

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
