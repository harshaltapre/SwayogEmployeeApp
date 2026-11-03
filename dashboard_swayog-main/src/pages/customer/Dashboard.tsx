import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, ShieldCheck, Zap, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetCustomerInstallationData } from "@/lib/api-client";
import { format } from "date-fns";

const TRACKER_STEPS = [
  "Site Survey",
  "Document Collection",
  "Approval and Advance Payment",
  "Licensing",
  "2nd Instalment",
  "Procurement",
  "Vendor Selection",
  "Installation",
  "WCR (Work Completion Report)",
  "3rd Instalment",
  "Meter Installation & Subsidy Redeem",
  "System Handover",
];

export default function CustomerDashboard() {
  const { data: customer, isLoading } = useGetCustomerInstallationData();

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  // -1 = Not started; 0–11 = stage at index is COMPLETED; stage+1 is In Progress
  const currentStage: number = customer?.projectStage ?? -1;

  // The "current active step" the customer sees is the next one (in_progress)
  const inProgressIndex = currentStage + 1;
  const inProgressStep =
    currentStage >= TRACKER_STEPS.length - 1
      ? "All Steps Completed 🎉"
      : currentStage < 0
      ? "Not Started Yet"
      : TRACKER_STEPS[inProgressIndex] ?? "All Steps Completed 🎉";

  // Progress: completed steps / total steps * 100
  const completedCount = currentStage < 0 ? 0 : currentStage + 1;
  const progressPercent = Math.round((completedCount / TRACKER_STEPS.length) * 100);

  return (
    <SidebarLayout>
      <PageHeader
        title={`Hello, ${customer?.name || "Customer"}`}
        description="Your solar journey at a glance."
      />

      {/* Hero Banner */}
      <div className="mb-8 p-6 bg-gradient-to-r from-orange-500 to-green-500 rounded-xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-1">Project Trajectory</p>
          <h2 className="text-2xl font-bold mb-3">
            {currentStage >= TRACKER_STEPS.length - 1
              ? "🎉 Installation Complete!"
              : currentStage < 0
              ? "Getting Started..."
              : `Next: ${inProgressStep}`}
          </h2>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 h-3 rounded-full max-w-md overflow-hidden mb-2">
            <div
              className="bg-white h-full transition-all duration-700 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-white/80 text-sm mb-6">
            {completedCount} of {TRACKER_STEPS.length} steps completed ({progressPercent}%)
          </p>

          <div className="flex gap-4">
            <Button
              variant="secondary"
              className="bg-white text-slate-900 hover:bg-slate-100"
              onClick={() => (window.location.href = "/customer/installation")}
            >
              <Zap className="w-4 h-4 mr-2" /> Full Tracker
            </Button>
          </div>
        </div>
        <Sun className="absolute right-0 bottom-0 w-64 h-64 text-white opacity-10 translate-x-1/4 translate-y-1/4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-orange-500" /> System Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between pb-3 border-b">
              <span className="text-slate-500">System Size</span>
              <span className="font-medium">{customer?.systemSizeKw || 0} kW</span>
            </div>
            <div className="flex justify-between pb-3 border-b">
              <span className="text-slate-500">Installation Date</span>
              <span className="font-medium">
                {customer?.installationDate
                  ? format(new Date(customer.installationDate), "dd MMM yyyy")
                  : "Pending"}
              </span>
            </div>
            <div className="flex justify-between pb-3 border-b">
              <span className="text-slate-500">Panel Brand</span>
              <span className="font-medium">{customer?.panelBrand || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Project Status</span>
              <span className="font-medium capitalize text-green-600">
                {customer?.status || "Active"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" /> Current Step
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{inProgressStep}</h3>
            <p className="text-sm text-slate-500">The current phase of your solar installation.</p>
            {currentStage >= 0 && currentStage < TRACKER_STEPS.length - 1 && (
              <div className="mt-3 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
                ✓ {completedCount} step{completedCount !== 1 ? "s" : ""} completed
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
