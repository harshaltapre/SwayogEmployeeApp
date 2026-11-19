import { useEffect } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { useOnboardingStats, useListOnboardingRequests } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, CheckCircle, Clock, TrendingUp, UserPlus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function OnboardingOverview() {
  const [location, setLocation] = useLocation();
  const onboardingPath = location.startsWith("/marketing/onboarding")
    ? "/marketing/onboarding"
    : "/admin/onboarding";
  const { data: stats, isLoading: statsLoading } = useOnboardingStats();
  const { data: requests, isLoading: requestsLoading } = useListOnboardingRequests({ limit: 10 });

  const statCards = [
    {
      title: "Total Requests",
      value: stats?.totalRequests || 0,
      icon: Users,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "New Requests",
      value: stats?.newRequests || 0,
      icon: UserPlus,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      title: "Site Visits Pending",
      value: stats?.siteVisitPending || 0,
      icon: Calendar,
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      title: "Quotations Review",
      value: stats?.quotationsReview || 0,
      icon: FileText,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals || 0,
      icon: Clock,
      color: "bg-rose-500",
      bgColor: "bg-rose-50",
      textColor: "text-rose-600",
    },
    {
      title: "Converted",
      value: stats?.converted || 0,
      icon: CheckCircle,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
  ];

  const getStageBadge = (stage: string) => {
    const stageColors: Record<string, { variant: string; label: string }> = {
      NEW_REQUEST: { variant: "default", label: "New" },
      INITIAL_REVIEW: { variant: "secondary", label: "Review" },
      SITE_VISIT_PENDING: { variant: "outline", label: "Visit Pending" },
      SITE_VISIT_SCHEDULED: { variant: "outline", label: "Visit Scheduled" },
      SITE_VISIT_COMPLETED: { variant: "secondary", label: "Visit Done" },
      QUOTATION_DRAFT: { variant: "outline", label: "Draft" },
      QUOTATION_REVIEW: { variant: "default", label: "Review" },
      QUOTATION_SENT: { variant: "secondary", label: "Sent" },
      CUSTOMER_DECISION_PENDING: { variant: "outline", label: "Decision" },
      ONBOARDING_APPROVAL: { variant: "default", label: "Approval" },
      APPROVED_CONVERTED: { variant: "default", label: "Converted" },
      REJECTED_CANCELLED: { variant: "destructive", label: "Rejected" },
    };
    return stageColors[stage] || { variant: "outline", label: stage };
  };

  return (
    <SidebarLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Customer Onboarding</h1>
            <p className="text-slate-500 mt-1">Manage prospective customers from enquiry to conversion</p>
          </div>
          <Button onClick={() => setLocation(`${onboardingPath}/requests`)}>
            <UserPlus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-5 h-5 ${stat.textColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`${onboardingPath}/requests?stage=NEW_REQUEST`)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">New Requests</p>
                  <p className="text-sm text-slate-500">Review new enquiries</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`${onboardingPath}/requests?stage=SITE_VISIT_PENDING`)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Site Visits</p>
                  <p className="text-sm text-slate-500">Schedule and manage visits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`${onboardingPath}/requests?stage=ONBOARDING_APPROVAL`)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Pending Approvals</p>
                  <p className="text-sm text-slate-500">Review and approve conversions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Requests</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setLocation(`${onboardingPath}/requests`)}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : requests && requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((request) => {
                  const badge = getStageBadge(request.stage);
                  return (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setLocation(`${onboardingPath}/requests/${request.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-semibold text-slate-600">
                          {request.customerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{request.customerName}</p>
                          <p className="text-sm text-slate-500">{request.requestNumber} • {request.phoneNumber}</p>
                        </div>
                      </div>
                      <Badge variant={badge.variant as any}>{badge.label}</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No onboarding requests yet. Create your first request to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
