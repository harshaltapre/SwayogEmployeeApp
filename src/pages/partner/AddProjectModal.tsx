import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitLead, getListCustomersQueryKey } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const projectSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required"),
  phoneNumber: z.string().trim().min(8, "Phone is required"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  address: z.string().trim().min(5, "Address is required"),
  systemSizeKw: z.coerce.number().positive("System size is required"),
  projectType: z.string().optional(),
});

export function AddProjectModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { fullName: "", phoneNumber: "", email: "", city: "", address: "", systemSizeKw: 1 },
  });

  const queryClient = useQueryClient();
  const createMutation = useSubmitLead({
    mutation: {
      onSuccess: () => {
        toast({ title: "Project Added", description: "Your referred project has been submitted." });
        onOpenChange(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      },
      onError: (err: any) => {
        const errorMsg = err.message || err.error || "Failed to add project.";
        toast({ title: "Submission Failed", description: errorMsg, variant: "destructive" });
      }
    }
  });

  const onSubmit = (values: z.infer<typeof projectSchema>) => {
    createMutation.mutate({
      customerName: values.fullName,
      phone: values.phoneNumber,
      location: values.city,
      capacity: values.systemSizeKw.toString(),
      address: values.address,
      email: values.email,
      state: values.state,
      projectType: values.projectType,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Refer a New Project</DialogTitle>
          <DialogDescription>Submit a new customer lead to earn commissions.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="systemSizeKw" render={({ field }) => (
                <FormItem><FormLabel>System (kW)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="state" render={({ field }) => (
                <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email (Optional)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="projectType" render={({ field }) => (
                <FormItem><FormLabel>Project Type</FormLabel><FormControl><Input placeholder="e.g. Residential, Commercial" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Lead
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
