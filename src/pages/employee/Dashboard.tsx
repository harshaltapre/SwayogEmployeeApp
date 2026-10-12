import React, { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Redirect } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { CheckCircle, Clock, Calendar, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth, isInventoryExecutiveJobRole, isSubAdminJobRole } from "@/lib/auth";
import { useSaveWorkDescription, useListTasks } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [workDescription, setWorkDescription] = useState("");
  const { toast } = useToast();
  const saveWorkDescriptionMutation = useSaveWorkDescription();

  const { data: tasks, isLoading: tasksLoading } = useListTasks(
    { employeeUserId: user?.id },
    { query: { enabled: !!user?.id } }
  );

  const activeCount = tasks?.filter(t => t.status !== "completed")?.length ?? 0;
  const completedCount = tasks?.filter(t => t.status === "completed")?.length ?? 0;

  if (!user) return null;
  if (isInventoryExecutiveJobRole(user.jobRole)) return <Redirect to="/inventory/dashboard" />;
  if (isSubAdminJobRole(user.jobRole)) return <Redirect to="/subadmin/dashboard" />;

  const handleSaveWorkDescription = async () => {
    if (!workDescription.trim()) {
      toast({
        title: "Empty Description",
        description: "Please describe your current work before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveWorkDescriptionMutation.mutateAsync({
        data: {
          employeeId: user.id,
          description: workDescription,
          timestamp: new Date().toISOString(),
        },
      });

      toast({
        title: "Work Description Saved",
        description: "Your work description has been sent to the admin.",
      });
      
      setWorkDescription("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save work description. Please try again.",
        variant: "destructive",
      });
    }
  };



  return (
    <SidebarLayout>
      <PageHeader title="My Dashboard" description="Overview of your tasks and performance." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard 
          title="Active Tasks" 
          value={tasksLoading ? "..." : activeCount} 
          icon={<Clock className="h-5 w-5 text-blue-500" />} 
        />
        <StatCard 
          title="Completed Tasks" 
          value={tasksLoading ? "..." : completedCount} 
          icon={<CheckCircle className="h-5 w-5 text-emerald-500" />} 
        />
        <StatCard 
          title="Upcoming" 
          value={tasksLoading ? "..." : (tasks?.length ?? 0)} 
          icon={<Calendar className="h-5 w-5 text-amber-500" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              All Assigned Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {tasksLoading ? (
              <div className="p-8 text-center text-slate-500">Loading tasks...</div>
            ) : tasks && tasks.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <div key={task.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 leading-tight">{task.jobType}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Clock className="h-3 w-3" />
                          {task.scheduledTime}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {task.status || "assigned"}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600 mb-2">{task.address}</div>
                    <div className="text-xs text-slate-500 font-medium">Customer: {task.customerName}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">No tasks found.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Current Work Description
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Textarea
                placeholder="Describe what work you are currently doing or planning to do..."
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                className="min-h-[180px] resize-none border-slate-200"
              />
              <Button
                onClick={handleSaveWorkDescription}
                disabled={saveWorkDescriptionMutation.isPending || !workDescription.trim()}
                className="w-full min-h-[44px] px-4 font-bold shadow-lg"
              >
                <Send className="h-4 w-4 mr-2" />
                {saveWorkDescriptionMutation.isPending ? "Saving..." : "Save & Send to Admin"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
