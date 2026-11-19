import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { useCreateOnboardingRequest, useListEmployees } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const PRODUCT_OPTIONS = [
  "Solar Rooftop Installation",
  "Solar Water Heater",
  "Solar Street Light",
  "Solar Pump",
  "Solar Savings Calculation",
  "EPC Consultation",
  "Other",
];

export default function NewOnboardingRequest() {
  const [location, setLocation] = useLocation();
  const onboardingPath = location.startsWith("/marketing/onboarding")
    ? "/marketing/onboarding"
    : "/admin/onboarding";
  const { toast } = useToast();
  const createMutation = useCreateOnboardingRequest();

  const { data: employees } = useListEmployees({ limit: 100 });

  const [form, setForm] = useState({
    customerName: "",
    companyName: "",
    phoneNumber: "",
    email: "",
    siteAddress: "",
    location: "",
    requestedProduct: "",
    customerRequirements: "",
    assignedEmployeeId: "",
    enquiryDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.customerName.trim()) errs.customerName = "Customer name is required";
    if (!form.phoneNumber.trim()) errs.phoneNumber = "Phone number is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address";
    if (!form.siteAddress.trim()) errs.siteAddress = "Site address is required";
    if (!form.requestedProduct) errs.requestedProduct = "Please select a product";
    if (!form.enquiryDate) errs.enquiryDate = "Enquiry date is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        customerName: form.customerName.trim(),
        companyName: form.companyName.trim() || null,
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || null,
        siteAddress: form.siteAddress.trim(),
        location: form.location.trim() || null,
        requestedProduct: form.requestedProduct,
        customerRequirements: form.customerRequirements.trim() || null,
        assignedEmployeeId: form.assignedEmployeeId || null,
        enquiryDate: form.enquiryDate,
        notes: form.notes.trim() || null,
      };
      const result = await createMutation.mutateAsync(payload) as { id: string; requestNumber: string };
      toast({ title: "Request created", description: `${result.requestNumber} has been created successfully.` });
      setLocation(`${onboardingPath}/requests/${result.id}`);
    } catch (err: any) {
      toast({
        title: "Failed to create request",
        description: err?.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation(`${onboardingPath}/requests`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">New Onboarding Request</h1>
            <p className="text-slate-500 mt-1">Register a new customer enquiry</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="customerName">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    placeholder="e.g. Rajesh Sharma"
                    value={form.customerName}
                    onChange={(e) => set("customerName", e.target.value)}
                    className={errors.customerName ? "border-red-400" : ""}
                  />
                  {errors.customerName && (
                    <p className="text-xs text-red-500">{errors.customerName}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companyName">Company / Organisation Name</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g. Sharma Enterprises (optional)"
                    value={form.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phoneNumber">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    placeholder="e.g. 9876543210"
                    value={form.phoneNumber}
                    onChange={(e) => set("phoneNumber", e.target.value)}
                    className={errors.phoneNumber ? "border-red-400" : ""}
                  />
                  {errors.phoneNumber && (
                    <p className="text-xs text-red-500">{errors.phoneNumber}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. rajesh@example.com (optional)"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className={errors.email ? "border-red-400" : ""}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Site & Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Site &amp; Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="siteAddress">
                    Site Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="siteAddress"
                    placeholder="e.g. Plot 12, MIDC Road, Nagpur"
                    value={form.siteAddress}
                    onChange={(e) => set("siteAddress", e.target.value)}
                    className={errors.siteAddress ? "border-red-400" : ""}
                  />
                  {errors.siteAddress && (
                    <p className="text-xs text-red-500">{errors.siteAddress}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location">City / Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g. Nagpur, Maharashtra"
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="requestedProduct">
                    Requested Product <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.requestedProduct}
                    onValueChange={(v) => set("requestedProduct", v)}
                  >
                    <SelectTrigger
                      id="requestedProduct"
                      className={errors.requestedProduct ? "border-red-400" : ""}
                    >
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.requestedProduct && (
                    <p className="text-xs text-red-500">{errors.requestedProduct}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customerRequirements">Customer Requirements</Label>
                <Textarea
                  id="customerRequirements"
                  placeholder="Describe what the customer is looking for, their energy usage, roof details, budget, etc."
                  value={form.customerRequirements}
                  onChange={(e) => set("customerRequirements", e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Assignment & Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assignment &amp; Scheduling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="enquiryDate">
                    Enquiry Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="enquiryDate"
                    type="date"
                    value={form.enquiryDate}
                    onChange={(e) => set("enquiryDate", e.target.value)}
                    className={errors.enquiryDate ? "border-red-400" : ""}
                  />
                  {errors.enquiryDate && (
                    <p className="text-xs text-red-500">{errors.enquiryDate}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="assignedEmployee">Assign to Employee</Label>
                  <Select
                    value={form.assignedEmployeeId}
                    onValueChange={(v) => set("assignedEmployeeId", v === "unassigned" ? "" : v)}
                  >
                    <SelectTrigger id="assignedEmployee">
                      <SelectValue placeholder="Select an employee (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Not assigned</SelectItem>
                      {employees?.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any internal notes for the team (not visible to the customer)"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(`${onboardingPath}/requests`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Request
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </SidebarLayout>
  );
}
