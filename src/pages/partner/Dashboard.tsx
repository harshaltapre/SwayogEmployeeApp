import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Briefcase, IndianRupee, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useListCustomers, useListPartnerPayouts, getListPartnerPayoutsQueryKey } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function PartnerDashboard() {
  const { data: customers = [], isLoading: isLoadingCustomers } = useListCustomers();
  const { data: payouts = [] } = useListPartnerPayouts({
    query: { queryKey: getListPartnerPayoutsQueryKey() }
  });

  const activeProjects = customers.length;
  const totalEarnings = customers.reduce((acc, c) => acc + (c.commissionAmount || ((c.systemSizeKw || 1) * 2500)), 0);
  const totalPendingCommission = customers.reduce((acc, c) => {
    const isPaid = String(c.commissionStatus ?? "PENDING").toUpperCase() === "COMPLETED";
    return isPaid ? acc : acc + (c.commissionAmount || ((c.systemSizeKw || 1) * 2500));
  }, 0);
  const pendingPayout = totalPendingCommission;

  return (
    <SidebarLayout>
      <PageHeader title="Partner Dashboard" description="Track your referrals and commissions." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Active Projects" 
          value={activeProjects.toString()} 
          icon={<Briefcase className="h-5 w-5" />} 
        />
        <StatCard 
          title="Total Earnings" 
          value={`₹${totalEarnings.toLocaleString()}`} 
          icon={<IndianRupee className="h-5 w-5 text-green-600" />} 
        />
        <StatCard 
          title="Pending Payout" 
          value={`₹${pendingPayout.toLocaleString()}`} 
          icon={<Clock className="h-5 w-5 text-orange-500" />} 
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingCustomers ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center p-4 border-b last:border-0 pb-4"><Skeleton className="h-10 w-full" /></div>
              ))
            ) : customers.length === 0 ? (
              <div className="text-center text-slate-500 py-6">No recent projects found.</div>
            ) : customers.slice(0, 5).map((project) => {
              const isPaymentCompleted = String(project.commissionStatus ?? "PENDING").toUpperCase() === "COMPLETED";
              return (
                <div key={project.id} className="flex justify-between items-center p-4 border-b last:border-0 pb-4">
                  <div>
                    <p className="font-medium text-slate-900">{project.name}</p>
                    <p className="text-sm text-slate-500">{project.systemSizeKw || 1}kW Residential System</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={isPaymentCompleted || project.projectStage === 4 ? 'completed' : 'in_progress'} />
                    <span className="text-sm font-medium text-green-600">Est. ₹{((project.systemSizeKw || 1) * 2500).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </SidebarLayout>
  );
}
