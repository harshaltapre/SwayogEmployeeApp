// Trigger HMR update
import React, { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import {
  Handshake, Users, IndianRupee, Clock, Zap, Briefcase, Plus, ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useListCustomers, getListCustomersQueryKey } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { AddProjectModal } from "./AddProjectModal";

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: apiCustomers = [] } = useListCustomers();

  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  const queryClient = useQueryClient();

  const formattedCustomers = apiCustomers.map((c: any) => {
    const stageStr = c.projectStage === 4 ? 'Complete' : c.projectStage === 3 ? 'Installation' : c.projectStage === 2 ? 'Survey' : 'Lead';
    const progress = c.projectStage === 4 ? 100 : c.projectStage === 3 ? 75 : c.projectStage === 2 ? 50 : 25;
    const amount = (c.systemSizeKw || 1) * 50000;
    const commission = (c.systemSizeKw || 1) * 2500;
    return {
      id: c.customerCode || c.id,
      customer: c.name,
      location: c.city || "Unknown",
      capacity: `${c.systemSizeKw || 0} kWp`,
      amount,
      commission,
      stage: stageStr,
      progress,
    };
  });

  const totalCommission = formattedCustomers.reduce((sum: number, r: any) => sum + r.commission, 0);
  const paidCommission = formattedCustomers.filter((r: any) => r.progress === 100).reduce((sum: number, r: any) => sum + r.commission, 0);
  const pendingPayout = totalCommission - paidCommission;
  const totalCapacity = formattedCustomers.reduce((sum: number, r: any) => {
    const num = parseFloat(r.capacity);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <SidebarLayout>
      <div className="space-y-6 pb-12">

        {/* Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #10b981 0%, transparent 60%)" }} />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                <Handshake className="h-3.5 w-3.5" /> Channel Partner Portal
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Partner Command & Commission Dashboard
              </h1>
              <p className="text-emerald-100 text-sm max-w-3xl leading-relaxed">
                Track your referred customer installations, monitor live project statuses, view earned commissions, and request payouts.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setIsAddLeadOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md">
                <Plus className="h-4 w-4 mr-1.5" /> Submit Customer Lead
              </Button>
              <Button onClick={() => setLocation("/partner/earnings")} className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs shadow-md">
                <IndianRupee className="h-4 w-4 mr-1.5" /> Request Payout
              </Button>
            </div>
          </div>
        </div>

        {/* Lead Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border shadow-xs bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-black text-slate-900">{formattedCustomers.length}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Total Leads</div>
            </CardContent>
          </Card>
          <Card className="border shadow-xs bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-black text-amber-600">{formattedCustomers.filter((c: any) => c.stage === 'Lead').length}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Pending Leads</div>
            </CardContent>
          </Card>
          <Card className="border shadow-xs bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-black text-blue-600">{formattedCustomers.filter((c: any) => c.stage === 'Survey' || c.stage === 'Installation').length}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Approved Leads</div>
            </CardContent>
          </Card>
          <Card className="border shadow-xs bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-black text-emerald-600">{formattedCustomers.filter((c: any) => c.stage === 'Complete').length}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Completed Leads</div>
            </CardContent>
          </Card>
          <Card className="border shadow-xs bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-black text-red-600">{apiCustomers.filter((c: any) => c.status === 'INACTIVE').length}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Rejected Leads</div>
            </CardContent>
          </Card>
        </div>

        {/* Commission Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border shadow-xs bg-white">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><IndianRupee className="h-6 w-6" /></div>
              <div>
                <div className="text-2xl font-black text-blue-700">₹ {totalCommission.toLocaleString('en-IN')}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Total Commission</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow-xs bg-white">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><Clock className="h-6 w-6" /></div>
              <div>
                <div className="text-2xl font-black text-amber-700">₹ {pendingPayout.toLocaleString('en-IN')}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Pending Commission</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow-xs bg-white">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><IndianRupee className="h-6 w-6" /></div>
              <div>
                <div className="text-2xl font-black text-emerald-700">₹ {paidCommission.toLocaleString('en-IN')}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Paid Commission</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referred Customers & Commission Table */}
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-emerald-600" /> Referred Customers & Project Status
              </CardTitle>
              <CardDescription className="text-xs">Live installation progress & commission status of your customer leads</CardDescription>
            </div>
            <Button onClick={() => setLocation("/partner/projects")} variant="outline" className="text-xs">
              View All Projects <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs font-bold">Project ID & Customer</TableHead>
                  <TableHead className="text-xs font-bold">Location</TableHead>
                  <TableHead className="text-xs font-bold">Capacity</TableHead>
                  <TableHead className="text-xs font-bold">Project Value</TableHead>
                  <TableHead className="text-xs font-bold">Commission (5%)</TableHead>
                  <TableHead className="text-xs font-bold">Installation Stage</TableHead>
                  <TableHead className="text-xs font-bold">Payout Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formattedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No referred customers yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  formattedCustomers.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-bold text-xs text-slate-900">{p.customer}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.id}</div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-700">{p.location}</TableCell>
                      <TableCell className="text-xs font-bold text-blue-700">{p.capacity}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">₹ {(p.amount || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-xs font-bold text-emerald-700">₹ {(p.commission || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <Badge className={p.progress === 100 ? "bg-emerald-600" : "bg-amber-600"}>
                        {p.stage} ({p.progress}%)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={p.progress === 100 ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-slate-100 text-slate-700"}>
                        {p.progress === 100 ? "Ready for Payout" : "In Progress"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Submit Customer Lead Modal */}
        <AddProjectModal open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen} />

      </div>
    </SidebarLayout>
  );
}
