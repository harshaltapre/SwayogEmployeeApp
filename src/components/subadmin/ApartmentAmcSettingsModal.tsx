import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CustomerRecord, useUpdateApartmentAmcSettings, useListEmployees } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, User, Wrench, Calendar as CalendarIcon } from "lucide-react";

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
  cleaningTimeSlot5: z.string().default("09:00"),
  cleaningTimeSlot6: z.string().default("09:00"),
  cleaningTimeSlot7: z.string().default("09:00"),
  cleaningTimeSlot8: z.string().default("09:00"),
  scheduleMonth: z.string().min(7, "Please select a month"),
});

type AmcSettingsFormValues = z.infer<typeof amcSettingsSchema>;

interface ApartmentAmcSettingsModalProps {
  apartment: {
    id: number;
    name: string;
    address: string;
    city: string;
    customers: CustomerRecord[];
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApartmentAmcSettingsModal({ apartment, open, onOpenChange }: ApartmentAmcSettingsModalProps) {
  const { toast } = useToast();
  const updateMutation = useUpdateApartmentAmcSettings();
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

  // Take the first customer as default reference, if available
  const defaultCustomer = apartment?.customers && apartment.customers.length > 0 
    ? apartment.customers[0] 
    : null;

  const form = useForm<AmcSettingsFormValues>({
    resolver: zodResolver(amcSettingsSchema),
    defaultValues: {
      clientType: defaultCustomer?.clientType || "post_paid",
      monthlyCleaningRate: defaultCustomer?.monthlyCleaningRate || 0,
      cleaningsPerMonth: defaultCustomer?.cleaningsPerMonth || 1,
      cleaningWindow1: defaultCustomer?.cleaningWindow1 || "1-10",
      cleaningWindow2: defaultCustomer?.cleaningWindow2 || "11-20",
      cleaningWindow3: defaultCustomer?.cleaningWindow3 || "21-30",
      cleaningWindow4: defaultCustomer?.cleaningWindow4 || "",
      cleaningWindow5: defaultCustomer?.cleaningWindow5 || "",
      cleaningWindow6: defaultCustomer?.cleaningWindow6 || "",
      cleaningWindow7: defaultCustomer?.cleaningWindow7 || "",
      cleaningWindow8: defaultCustomer?.cleaningWindow8 || "",
      nextSurveyDate: "",
      paymentTerms: defaultCustomer?.paymentTerms || "",
      remarks: defaultCustomer?.remarks || "",
      assignedEmployeeId: defaultCustomer?.assignedEmployeeId || "",
      useVariableTiming: false,
      cleaningTimeSlot1: "09:00",
      cleaningTimeSlot2: "09:00",
      cleaningTimeSlot3: "09:00",
      cleaningTimeSlot4: "09:00",
      cleaningTimeSlot5: "09:00",
      cleaningTimeSlot6: "09:00",
      cleaningTimeSlot7: "09:00",
      cleaningTimeSlot8: "09:00",
      scheduleMonth: format(new Date(), "yyyy-MM"),
    },
  });

  // Reset form when apartment changes or modal opens
  React.useEffect(() => {
    if (open && apartment) {
      const refCust = apartment.customers && apartment.customers.length > 0 
        ? apartment.customers[0] 
        : null;

      form.reset({
        clientType: refCust?.clientType || "post_paid",
        monthlyCleaningRate: refCust?.monthlyCleaningRate || 0,
        cleaningsPerMonth: refCust?.cleaningsPerMonth || 1,
        cleaningWindow1: refCust?.cleaningWindow1 || "1-10",
        cleaningWindow2: refCust?.cleaningWindow2 || "11-20",
        cleaningWindow3: refCust?.cleaningWindow3 || "21-30",
        cleaningWindow4: refCust?.cleaningWindow4 || "",
        cleaningWindow5: refCust?.cleaningWindow5 || "",
        cleaningWindow6: refCust?.cleaningWindow6 || "",
        cleaningWindow7: refCust?.cleaningWindow7 || "",
        cleaningWindow8: refCust?.cleaningWindow8 || "",
        nextSurveyDate: "",
        paymentTerms: refCust?.paymentTerms || "",
        remarks: refCust?.remarks || "",
        assignedEmployeeId: refCust?.assignedEmployeeId || "",
        useVariableTiming: false,
        cleaningTimeSlot1: "09:00",
        cleaningTimeSlot2: "09:00",
        cleaningTimeSlot3: "09:00",
        cleaningTimeSlot4: "09:00",
        cleaningTimeSlot5: "09:00",
        cleaningTimeSlot6: "09:00",
        cleaningTimeSlot7: "09:00",
        cleaningTimeSlot8: "09:00",
        scheduleMonth: format(new Date(), "yyyy-MM"),
      });
    }
  }, [apartment, open, form]);

  const onSubmit = (values: AmcSettingsFormValues) => {
    if (!apartment) return;

    const payload = {
      ...values,
      assignedEmployeeId: values.assignedEmployeeId && values.assignedEmployeeId !== "none" ? values.assignedEmployeeId : null,
      nextSurveyDate: values.nextSurveyDate || undefined,
    };

    updateMutation.mutate({
      apartmentId: apartment.id,
      data: payload,
    }, {
      onSuccess: () => {
        toast({ title: "Apartment AMC Settings Updated", description: `Configuration for all customers under ${apartment.name} saved successfully.` });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        onOpenChange(false);
      },
      onError: (err: any) => {
        const errMsg = err?.error || err?.message || (err instanceof Error ? err.message : "Error saving settings");
        toast({ title: "Bulk Update Failed", description: errMsg, variant: "destructive" });
      }
    });
  };

  const cleaningsCount = form.watch("cleaningsPerMonth");
  const useVariableTiming = form.watch("useVariableTiming");

  if (!apartment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-600">
            <Building2 className="h-5 w-5" />
            <DialogTitle className="text-xl">Apartment AMC Settings: {apartment.name}</DialogTitle>
          </div>
          <DialogDescription>
            Configure bulk AMC settings and scheduling for all customers residing in this apartment building.
          </DialogDescription>
        </DialogHeader>

        {/* List of Customers Under this Apartment */}
        <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/30 my-2">
          <h4 className="text-xs uppercase font-bold text-indigo-700 tracking-wider flex items-center gap-1.5 mb-2.5">
            <User className="h-3.5 w-3.5" /> Customers in this Apartment ({apartment.customers?.length || 0})
          </h4>
          <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
            {apartment.customers && apartment.customers.length > 0 ? (
              apartment.customers.map((cust) => (
                <div key={cust.id} className="flex justify-between items-center text-xs bg-white border border-slate-100 p-2 rounded-lg shadow-sm">
                  <div>
                    <span className="font-semibold text-slate-800">{cust.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">({cust.customerCode || `#${cust.id}`})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{cust.systemSizeKw} kW</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-600">
                      {cust.clientType?.replace("_", " ") || "Post Paid"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-2">No active AMC customers in this apartment.</p>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Type (Bulk)</FormLabel>
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
                name="scheduleMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Month & Year (Bulk)</FormLabel>
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
                    <FormLabel>Cleanings Per Month (Bulk)</FormLabel>
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
                    <FormLabel>Monthly Cleaning Rate (₹) (Bulk)</FormLabel>
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
              <Label className="text-sm font-semibold flex items-center gap-1">
                <CalendarIcon className="h-4 w-4 text-slate-500" /> Cleaning Slots (Date Windows)
              </Label>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <React.Fragment key={i}>
                    {cleaningsCount >= i && (
                      <FormField
                        control={form.control}
                        name={`cleaningWindow${i}` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold">Slot {i}</FormLabel>
                            <FormControl>
                              <Input placeholder={`${(i - 1) * 3 + 1}-${i * 3 + 2}`} className="h-9 text-xs" {...field} />
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

            {/* Visit Timing Configuration */}
            <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
              <Label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                <Wrench className="h-4 w-4 text-slate-500" /> Visit Timing Settings
              </Label>
              
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
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <React.Fragment key={i}>
                      {cleaningsCount >= i && (
                        <FormField
                           control={form.control}
                           name={`cleaningTimeSlot${i}` as any}
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel className="text-[10px] font-bold">Visit #{i} Slot</FormLabel>
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
                    <FormLabel>Next Survey Date (Bulk)</FormLabel>
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
                    <FormLabel>Payment Terms (Bulk)</FormLabel>
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
                  <FormLabel>Assign Employee / Technician (Bulk)</FormLabel>
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
                  <FormLabel>Remarks / Instructions (Bulk)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Special instructions for visits..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {updateMutation.isPending ? "Scheduling All..." : `Schedule All Customers (${apartment.customers?.length || 0})`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
