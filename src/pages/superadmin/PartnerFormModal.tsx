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
import { useCreatePartner, CreatePartnerInput } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";

function parseErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Unable to create partner";
  }

  const maybeError = error as Record<string, unknown>;
  if (typeof maybeError.error === "string") {
    return maybeError.error;
  }
  if (typeof maybeError.message === "string") {
    return maybeError.message;
  }
  return "Unable to create partner";
}

const createPartnerSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters"),
  companyName: z.string().trim().min(2, "Company name is required"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phoneNumber: z.string().trim().optional(),
  zone: z.string().trim().min(2, "Zone is required"),
});

type CreatePartnerValues = z.infer<typeof createPartnerSchema>;

const defaultValues: CreatePartnerValues = {
  fullName: "",
  companyName: "",
  email: "",
  password: "",
  phoneNumber: "",
  zone: "",
};

interface PartnerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PartnerFormModal({ open, onOpenChange, onSuccess }: PartnerFormModalProps) {
  const { toast } = useToast();
  const form = useForm<CreatePartnerValues>({
    resolver: zodResolver(createPartnerSchema),
    defaultValues,
  });

  const createMutation = useCreatePartner({
    mutation: {
      onSuccess: (data: any) => {
        toast({ title: "Partner created", description: `${data.fullName || 'Partner'} added successfully.` });
        onOpenChange(false);
        form.reset(defaultValues);
        if (onSuccess) onSuccess();
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Partner</DialogTitle>
          <DialogDescription>Create a new partner account.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate({ data: data as CreatePartnerInput }))} className="space-y-4">
            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Partner representative name" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="companyName" render={({ field }) => (
              <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="Business/Company Name" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="partner@example.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Set initial password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phoneNumber" render={({ field }) => (
              <FormItem><FormLabel>Phone Number (Optional)</FormLabel><FormControl><Input placeholder="+91 98XXXXXXXX" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="zone" render={({ field }) => (
              <FormItem><FormLabel>Service Zone</FormLabel><FormControl><Input placeholder="e.g. Pune North" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto mt-4">
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Partner"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
