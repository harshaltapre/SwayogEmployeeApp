import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, ShieldCheck, Zap, Clock, Loader2, Package, Calendar, Star, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetCustomerInstallationData, useGetCustomerDispatches, useListTasks, useRateTaskAssignment, useGetCustomerNotifications, useMarkCustomerNotificationRead } from "@/lib/api-client";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const { data: customer, isLoading } = useGetCustomerInstallationData();
  const { data: dispatches = [], isLoading: dispatchesLoading } = useGetCustomerDispatches();
  const { data: tasks = [], refetch: refetchTasks } = useListTasks();
  const rateTaskMutation = useRateTaskAssignment();
  const { data: notifications = [] } = useGetCustomerNotifications();
  const markReadMutation = useMarkCustomerNotificationRead();

  const [selectedReviewTask, setSelectedReviewTask] = useState<any | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>("");
  const [fixCharges, setFixCharges] = useState<string>("");

  const completedTasksNeedingReview = tasks.filter(
    (t: any) => t.status === "completed" && !t.customerRating
  );

  const totalCost = dispatches.reduce((sum, record) => {
    return sum + (record.quantity * (record.pricePerUnit ?? 0));
  }, 0);

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

      {/* Pending Reviews Section */}
      {completedTasksNeedingReview.length > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            ⭐ Review Technician's Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedTasksNeedingReview.map((task: any) => (
              <Card key={task.id} className="border-amber-200 bg-amber-50/20 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Pending Review</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {format(new Date(task.scheduledTime), "dd MMM yyyy")}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{task.jobType} Complete</h3>
                    <p className="text-xs text-slate-650 line-clamp-2">{task.description}</p>
                    {task.completionMessage && (
                      <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200/60 mt-1.5 leading-relaxed">
                        Remarks: "{task.completionMessage}"
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs h-9 rounded-lg"
                    onClick={() => {
                      setRating(5);
                      setFeedback("");
                      setFixCharges("");
                      setSelectedReviewTask(task);
                    }}
                  >
                    Provide Rating & Cost Confirm
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> AMC & Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between pb-3 border-b">
              <span className="text-slate-500">AMC Status</span>
              <span className={`font-semibold capitalize ${customer?.amcStatus === "active" ? "text-emerald-600" : "text-slate-500"}`}>
                {customer?.amcStatus || "None"}
              </span>
            </div>
            <div className="flex justify-between pb-3 border-b">
              <span className="text-slate-500">Cleanings Done</span>
              <span className="font-bold text-emerald-600">{customer?.completedVisits ?? 0} Cleanings</span>
            </div>
            <div className="flex justify-between pb-3 border-b">
              <span className="text-slate-500">Cleanings Pending</span>
              <span className="font-semibold text-amber-600">{customer?.pendingVisits ?? 0} Pending</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Monthly Allotment</span>
              <span className="font-semibold">{customer?.cleaningsPerMonth || 2} cleanings/mo</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" /> Current Step
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

      {/* Notifications Section */}
      <Card className="mt-6 shadow-sm border-slate-200">
        <CardHeader className="border-b bg-slate-50/50 py-4">
          <CardTitle className="flex items-center gap-2 text-slate-800 text-lg font-bold">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" /> Notifications & Service Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="text-center py-8 px-4 text-slate-500">
              <p className="text-sm font-medium text-slate-500">No updates or notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {notifications.map((n: any) => (
                <div key={n.id} className={`flex items-start justify-between gap-4 p-4 transition-colors hover:bg-slate-50/60 ${!n.isRead ? "bg-amber-50/5 font-medium" : ""}`}>
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      {!n.isRead ? (
                        <span className="flex h-2 w-2 relative mt-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-450 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                      ) : (
                        <span className="inline-block h-2 w-2 rounded-full bg-slate-350 mt-1.5"></span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-700 leading-normal">{n.message}</p>
                      <p className="text-[11px] text-slate-400">
                        {format(new Date(n.createdAt), "dd MMM yyyy, hh:mm a")}
                      </p>
                    </div>
                  </div>
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary hover:text-primary/80 shrink-0 h-8 font-bold"
                      disabled={markReadMutation.isPending}
                      onClick={() => markReadMutation.mutate(n.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispatched Materials Section */}
      <Card className="mt-6 shadow-sm border-slate-200">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-slate-800 text-lg font-bold">
              <Package className="w-5 h-5 text-blue-600" /> Dispatched Materials & Cost
            </CardTitle>
            {dispatches.length > 0 && (
              <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Total Material Value: ₹{totalCost.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {dispatchesLoading ? (
            <div className="flex items-center justify-center p-8 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2 text-primary" /> Loading material dispatches...
            </div>
          ) : dispatches.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-500">
              <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-700">No materials dispatched yet</p>
              <p className="text-xs text-slate-400 mt-1">Materials dispatched for your site installation will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-700">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Material Name</th>
                    <th className="px-6 py-3">Dispatched Date</th>
                    <th className="px-6 py-3 text-right">Quantity</th>
                    <th className="px-6 py-3 text-right">Unit Price</th>
                    <th className="px-6 py-3 text-right font-bold text-slate-900">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dispatches.map((record) => {
                    const price = record.pricePerUnit ?? 0;
                    const itemCost = record.quantity * price;
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {record.itemName}
                          {record.notes && (
                            <span className="block text-[11px] font-normal text-slate-500 italic mt-0.5">{record.notes}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {format(new Date(record.dispatchedAt), "dd MMM yyyy")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">{record.quantity}</td>
                        <td className="px-6 py-4 text-right font-mono text-slate-500">₹{price.toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-blue-600">₹{itemCost.toLocaleString("en-IN")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedReviewTask} onOpenChange={(open) => { if (!open) setSelectedReviewTask(null); }}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-md rounded-xl p-6 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              ⭐ Rate and Confirm Task
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Your feedback helps us maintain quality and track job financials.
            </DialogDescription>
          </DialogHeader>

          {selectedReviewTask && (
            <div className="space-y-4 pt-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Job Type:</span>
                  <span>{selectedReviewTask.jobType}</span>
                </div>
                <div className="text-slate-500">{selectedReviewTask.description}</div>
                {selectedReviewTask.completionMessage && (
                  <div className="text-slate-500 italic mt-1 bg-white p-1.5 rounded border border-slate-200">
                    "{selectedReviewTask.completionMessage}"
                  </div>
                )}
              </div>

              {/* Technician's uploaded photos with GPS coordinates */}
              {(selectedReviewTask.beforeImageUrl || selectedReviewTask.afterImageUrl) && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Work Proof Photos</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedReviewTask.beforeImageUrl && (
                      <div className="flex flex-col items-center border rounded p-1.5 bg-white">
                        <span className="text-[9px] font-bold text-slate-500 uppercase mb-1">Before Work</span>
                        <img src={selectedReviewTask.beforeImageUrl} alt="Before" className="w-full h-20 object-cover rounded border border-slate-100" />
                        {selectedReviewTask.beforeLatitude && (
                          <span className="text-[8px] text-slate-400 mt-1">📍 GPS Tagged</span>
                        )}
                      </div>
                    )}
                    {selectedReviewTask.afterImageUrl && (
                      <div className="flex flex-col items-center border rounded p-1.5 bg-white">
                        <span className="text-[9px] font-bold text-slate-500 uppercase mb-1">After Work</span>
                        <img src={selectedReviewTask.afterImageUrl} alt="After" className="w-full h-20 object-cover rounded border border-slate-100" />
                        {selectedReviewTask.afterLatitude && (
                          <span className="text-[8px] text-slate-400 mt-1">📍 GPS Tagged</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Star rating picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Your Rating
                </label>
                <div className="flex gap-2 justify-center py-2 bg-slate-50/50 rounded-lg border border-slate-100">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer text-amber-400"
                    >
                      <Star
                        className="h-8 w-8"
                        fill={star <= rating ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Fix Charges input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Final Fix Charges Paid (INR)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 1500"
                  value={fixCharges}
                  onChange={(e) => setFixCharges(e.target.value)}
                  className="border-slate-200 focus:ring-primary focus:border-primary text-sm bg-white"
                />
              </div>

              {/* Feedback comment input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Feedback & Comments
                </label>
                <Textarea
                  placeholder="Tell us about the service quality, technician behavior..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[80px] border-slate-200 focus:ring-primary focus:border-primary resize-none text-sm bg-white"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedReviewTask(null)}
              disabled={rateTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
              disabled={rateTaskMutation.isPending}
              onClick={() => {
                if (!selectedReviewTask) return;
                rateTaskMutation.mutate(
                  {
                    taskId: selectedReviewTask.id,
                    data: {
                      customerRating: rating,
                      customerFeedback: feedback.trim() || undefined,
                      fixCharges: fixCharges ? parseFloat(fixCharges) : null,
                    },
                  },
                  {
                    onSuccess: () => {
                      toast({
                        title: "Review Submitted",
                        description: "Thank you for your rating and charges confirmation.",
                      });
                      setSelectedReviewTask(null);
                      setFeedback("");
                      setFixCharges("");
                      setRating(5);
                      refetchTasks();
                    },
                    onError: (err: any) => {
                      toast({
                        title: "Failed to submit review",
                        description: err?.error || err?.message || "Something went wrong.",
                        variant: "destructive",
                      });
                    },
                  }
                );
              }}
            >
              {rateTaskMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
