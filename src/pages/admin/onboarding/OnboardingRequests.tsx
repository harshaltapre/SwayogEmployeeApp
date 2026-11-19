import { SidebarLayout } from "@/components/SidebarLayout";
import { useListOnboardingRequests } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, Calendar, FileText, Eye, Filter } from "lucide-react";
import { useLocation, useSearchParams } from "wouter";
import { useState } from "react";

export default function OnboardingRequests() {
  const [location, setLocation] = useLocation();
  const onboardingPath = location.startsWith("/marketing/onboarding")
    ? "/marketing/onboarding"
    : "/admin/onboarding";
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState(searchParams.get("stage") || "ALL");

  const { data: requests, isLoading } = useListOnboardingRequests({
    search: searchQuery || undefined,
    stage: stageFilter === "ALL" ? undefined : stageFilter,
    limit: 50,
  });

  const stages = [
    { value: "ALL", label: "All Stages" },
    { value: "NEW_REQUEST", label: "New Request" },
    { value: "INITIAL_REVIEW", label: "Initial Review" },
    { value: "SITE_VISIT_PENDING", label: "Site Visit Pending" },
    { value: "SITE_VISIT_SCHEDULED", label: "Site Visit Scheduled" },
    { value: "SITE_VISIT_COMPLETED", label: "Site Visit Completed" },
    { value: "QUOTATION_DRAFT", label: "Quotation Draft" },
    { value: "QUOTATION_REVIEW", label: "Quotation Review" },
    { value: "QUOTATION_SENT", label: "Quotation Sent" },
    { value: "CUSTOMER_DECISION_PENDING", label: "Customer Decision" },
    { value: "ONBOARDING_APPROVAL", label: "Pending Approval" },
    { value: "APPROVED_CONVERTED", label: "Converted" },
    { value: "REJECTED_CANCELLED", label: "Rejected" },
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

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleStageChange = (value: string) => {
    setStageFilter(value);
    setSearchParams(value === "ALL" ? {} : { stage: value });
  };

  return (
    <SidebarLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Onboarding Requests</h1>
            <p className="text-slate-500 mt-1">View and manage all customer onboarding requests</p>
          </div>
          <Button onClick={() => setLocation(`${onboardingPath}/requests/new`)}>
            <UserPlus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, phone, email, or request number..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={stageFilter} onValueChange={handleStageChange}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {requests?.length || 0} Request{requests?.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : requests && requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((request) => {
                  const badge = getStageBadge(request.stage);
                  return (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setLocation(`${onboardingPath}/requests/${request.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-semibold text-slate-600 text-lg">
                          {request.customerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{request.customerName}</p>
                          <p className="text-sm text-slate-500">
                            {request.requestNumber} • {request.phoneNumber} • {request.email}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {request.companyName && `${request.companyName} • `}
                            {request.requestedProduct}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                          <p className="text-xs text-slate-500">Enquiry Date</p>
                          <p className="text-sm font-medium text-slate-700">
                            {new Date(request.enquiryDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={badge.variant as any}>{badge.label}</Badge>
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <UserPlus className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="font-medium">No onboarding requests found</p>
                <p className="text-sm mt-1">Create a new request to get started</p>
                <Button className="mt-4" onClick={() => setLocation(`${onboardingPath}/requests/new`)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Request
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
