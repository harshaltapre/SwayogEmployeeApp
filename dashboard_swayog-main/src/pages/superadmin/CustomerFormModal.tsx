import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCustomer } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";

function parseErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Unable to create customer";
  }

  const maybeError = error as Record<string, unknown>;
  if (typeof maybeError.error === "string") {
    return maybeError.error;
  }
  if (typeof maybeError.message === "string") {
    return maybeError.message;
  }
  return "Unable to create customer";
}

const createCustomerSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email"),
  phoneNumber: z.string().trim().min(8, "Phone must be at least 8 characters"),
  city: z.string().trim().min(2, "City is required"),
  address: z.string().trim().min(5, "Address must be at least 5 characters"),
  systemSizeKw: z.coerce.number().positive("System size must be positive"),
  installationDate: z.string().min(1, "Installation date is required"),
  warrantyExpiry: z.string().optional(),
  panelBrand: z.string().optional(),
  inverterBrand: z.string().optional(),
  amcStatus: z.enum(["active", "expired", "none"]).default("none"),
  amcExpiryDate: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type CreateCustomerValues = z.infer<typeof createCustomerSchema>;

const defaultValues: CreateCustomerValues = {
  fullName: "",
  email: "",
  phoneNumber: "",
  city: "",
  address: "",
  systemSizeKw: 1,
  installationDate: "",
  warrantyExpiry: "",
  panelBrand: "",
  inverterBrand: "",
  amcStatus: "none",
  amcExpiryDate: "",
  status: "active",
};

interface CustomerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (credentials: { loginId: string; password?: string }) => void;
}

export function CustomerFormModal({ open, onOpenChange, onSuccess }: CustomerFormModalProps) {
  const { toast } = useToast();
  const form = useForm<CreateCustomerValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues,
  });

  const createMutation = useCreateCustomer({
    mutation: {
      onSuccess: (data: any) => {
        toast({ title: "Customer created", description: `${data.name} added successfully.` });
        onOpenChange(false);
        form.reset(defaultValues);
        if (onSuccess) onSuccess({ loginId: data.loginId, password: data.generatedPassword });
      },
      onError: (err: unknown) => {
        toast({
          title: "Creation failed",
          description: parseErrorMessage(err),
          variant: "destructive",
        });
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>Create a new customer profile and installation record.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate({ data: data as any }))} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Customer full name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+91 98XXXXXXXX" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="customer@example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="City" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Address</FormLabel><FormControl><Input placeholder="Street, area, landmark" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="systemSizeKw" render={({ field }) => (
                <FormItem><FormLabel>System Size (kW)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="installationDate" render={({ field }) => (
                <FormItem><FormLabel>Installation Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="warrantyExpiry" render={({ field }) => (
                <FormItem><FormLabel>Warranty Expiry (Optional)</FormLabel><FormControl><Input type="date" placeholder="dd-mm-yyyy" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="amcExpiryDate" render={({ field }) => (
                <FormItem><FormLabel>AMC Expiry (Optional)</FormLabel><FormControl><Input type="date" placeholder="dd-mm-yyyy" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="panelBrand" render={({ field }) => (
                <FormItem><FormLabel>Panel Brand (Optional)</FormLabel><FormControl><Input placeholder="Panel brand" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="inverterBrand" render={({ field }) => (
                <FormItem><FormLabel>Inverter Brand (Optional)</FormLabel><FormControl><Input placeholder="Inverter brand" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="amcStatus" render={({ field }) => (
                <FormItem><FormLabel>AMC Status</FormLabel><FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Customer Status</FormLabel><FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
