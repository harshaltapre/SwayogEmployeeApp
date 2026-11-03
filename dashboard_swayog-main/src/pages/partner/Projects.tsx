import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IndianRupee, MapPin, Zap, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useListCustomers, CustomerRecord, buildAssetUrlFromPath } from "@/lib/api-client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddProjectModal } from "./AddProjectModal";
import { Skeleton } from "@/components/ui/skeleton";

export default function PartnerProjects() {
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const { data: customers = [], isLoading } = useListCustomers();
  
  // Transform CustomerRecord to project format
  const projects = customers.map((c: CustomerRecord) => {
    const stageStr = c.projectStage === 4 ? 'complete' : c.projectStage === 3 ? 'installation' : c.projectStage === 2 ? 'survey' : 'lead';
    return {
      id: c.id,
      customerName: c.name,
      city: c.city || "Unknown",
      systemSizeKw: c.systemSizeKw || 1,
      stage: stageStr,
      revenue: (c.systemSizeKw || 1) * 50000,
      commission: (c.systemSizeKw || 1) * 2500,
      commissionStatus: c.commissionStatus,
      commissionProofUrl: c.commissionProofUrl,
    };
  });

  const getProgress = (stage: string) => {
    switch(stage) {
      case 'lead': return 25;
      case 'survey': return 50;
      case 'installation': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  return (
    <SidebarLayout>
      <PageHeader 
        title="My Projects" 
        description="Track the status of your referred customers." 
        action={
          <Button onClick={() => setIsAddProjectOpen(true)} className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" /> Add Project
          </Button>
        }
      />

      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>System Info</TableHead>
                <TableHead>Stage Tracker</TableHead>
                <TableHead className="text-right">Est. Commission</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5} className="py-4 text-center"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ))
              ) : projects.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">No projects found. Click "Add Project" to refer a customer.</TableCell></TableRow>
              ) : projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{project.customerName}</div>
                    <div className="flex items-center text-xs text-slate-500 mt-1">
                      <MapPin className="h-3 w-3 mr-1" /> {project.city}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-medium">
                      <Zap className="h-4 w-4 text-orange-500" /> {project.systemSizeKw} kW
                    </div>
                    <div className="text-xs text-slate-500 mt-1">₹{project.revenue.toLocaleString()} Value</div>
                  </TableCell>
                  <TableCell className="w-[30%]">
                    <div className="flex justify-between text-xs text-slate-500 mb-1 capitalize">
                      <span>{project.stage}</span>
                      <span>{getProgress(project.stage)}%</span>
                    </div>
                    <Progress value={getProgress(project.stage)} className="h-2" />
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    <div className="flex items-center justify-end gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {project.commission.toLocaleString()}
                    </div>
                    <div className="mt-1 flex flex-col items-end gap-1">
                      {String(project.commissionStatus ?? "PENDING").toUpperCase() === "COMPLETED" ? (
                        <>
                          <StatusBadge status="paid" className="text-[10px] py-0 h-4" />
                          {project.commissionProofUrl && (
                            <a 
                              href={buildAssetUrlFromPath(project.commissionProofUrl) ?? project.commissionProofUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-600 flex items-center gap-1 hover:underline"
                            >
                              View Proof
                            </a>
                          )}
                        </>
                      ) : (
                        <StatusBadge status="pending" className="text-[10px] py-0 h-4" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={String(project.commissionStatus ?? "PENDING").toUpperCase() === "COMPLETED" || project.stage === 'complete' ? 'completed' : 'in_progress'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      <AddProjectModal open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen} />
    </SidebarLayout>
  );
}
