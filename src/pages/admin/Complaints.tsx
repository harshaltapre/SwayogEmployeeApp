import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { useGetAdminComplaints } from "@/lib/api-client";
import { usePollWithVisibility } from "@/lib/data-sync";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { SLATimer } from "@/components/SLATimer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useState } from "react";
import { RefreshCw, Filter } from "lucide-react";

export default function AdminComplaints() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  
  const { data: complaintsData, isLoading, refetch: refetchComplaints } = useGetAdminComplaints();
  const complaints = complaintsData?.complaints;

  // Enable auto-sync polling
  usePollWithVisibility("admin-complaints", 30000);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchComplaints();
    } finally {
      setIsRefreshing(false);
    }
  };

  const columns = ["pending", "scheduled", "completed"];
  
  const filteredComplaints = complaints?.filter(c => 
    priorityFilter === "all" || c.priority === priorityFilter
  );

  return (
    <SidebarLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <PageHeader title="Complaints & Service Requests" description="Track and resolve customer issues with SLA monitoring." />
        <div className="flex gap-2">
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Syncing..." : "Sync"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          <div className="flex w-full sm:w-auto">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-slate-200 rounded-md bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>

        <TabsContent value="kanban" className="mt-0">
          <div className="flex flex-col md:flex-row gap-4 overflow-x-visible md:overflow-x-auto pb-4 min-h-[60vh] max-h-[calc(100vh-250px)]">
            {columns.map(status => {
              const statusComplaints = filteredComplaints?.filter(c => c.status === status) || [];
              return (
                <div key={status} className="w-full md:w-96 flex flex-col bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-700 capitalize mb-4 flex justify-between items-center">
                    {status === "pending" ? "New" : 
                     status === "scheduled" ? "Assigned" : 
                     status === "completed" ? "Resolved" : 
                     status.replace('_', ' ')}
                    <span className="bg-slate-200 text-slate-600 text-xs py-0.5 px-2.5 rounded-full font-medium">
                      {statusComplaints.length}
                    </span>
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {isLoading ? (
                      <>
                        <div className="h-24 bg-white rounded-lg animate-pulse"></div>
                        <div className="h-24 bg-white rounded-lg animate-pulse"></div>
                      </>
                    ) : statusComplaints.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm">No complaints</div>
                    ) : (
                      statusComplaints.map(complaint => (
                        <Card 
                          key={complaint.id} 
                          className="p-4 shadow-sm border-slate-200 cursor-pointer hover:shadow-md transition-all hover:border-slate-300 group"
                        >
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded truncate">
                              {complaint.ticketId}
                            </span>
                            <StatusBadge status={complaint.priority} className="text-[10px]" />
                          </div>
                          <h4 className="font-semibold text-sm mb-1 text-slate-900 group-hover:text-blue-600 transition-colors">
                            {complaint.type}
                          </h4>
                          <p className="text-xs text-slate-600 mb-3">{complaint.customerName}</p>
                          
                          <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                            📍 {complaint.zone || "Unassigned"}
                          </div>
                          
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                            <SLATimer deadline={complaint.slaDeadline} resolvedAt={complaint.resolvedAt} />
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold">Ticket ID</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Issue Type</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold">Zone</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold">Priority</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">SLA</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <TableRow key={i}>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                            <TableCell key={j}><div className="h-4 bg-slate-100 rounded animate-pulse w-16"></div></TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </>
                  ) : filteredComplaints?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">No complaints found</TableCell>
                    </TableRow>
                  ) : (
                    filteredComplaints?.map((complaint) => (
                      <TableRow key={complaint.id} className="hover:bg-slate-50">
                        <TableCell className="font-mono text-sm text-primary font-semibold">{complaint.ticketId}</TableCell>
                        <TableCell className="font-medium">{complaint.customerName}</TableCell>
                        <TableCell className="text-sm">{complaint.type}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{complaint.zone || "Unassigned"}</TableCell>
                        <TableCell className="hidden sm:table-cell"><StatusBadge status={complaint.priority} className="text-xs" /></TableCell>
                        <TableCell><StatusBadge status={complaint.status} className="text-xs" /></TableCell>
                        <TableCell><SLATimer deadline={complaint.slaDeadline} resolvedAt={complaint.resolvedAt} /></TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-slate-500">{format(new Date(complaint.createdAt), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </SidebarLayout>
  );
}
