import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MapPin, Phone, History, CalendarDays, Filter, Calendar, Edit2, X, Clock } from "lucide-react";
import { useListAmcVisits, useMarkVisitDone, useUpdateAmcVisit, useListEmployees, getListTasksQueryKey } from "@/lib/api-client";
import { format, isSameMonth, isSameDay, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function AmcVisitTracker() {
  const { toast } = useToast();
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [editingVisit, setEditingVisit] = useState<any | null>(null);
  const [newDate, setNewDate] = useState<string>("");
  const [newTime, setNewTime] = useState<string>("");

  const queryClient = useQueryClient();
  const { data: visits = [], isLoading } = useListAmcVisits();
  const { data: employees = [] } = useListEmployees();
  const markDoneMutation = useMarkVisitDone();
  const updateVisitMutation = useUpdateAmcVisit();

  const filteredEmployees = employees.filter(e => 
    ["Electrical Engineer", "Site Survey Engineer", "O&M Technician", "Service Engineer", "Field Technician", "Technician"].includes(e.role)
  );

  const getEmployeeName = (userId: string) => {
    const emp = employees.find(e => (e.userId === userId || String(e.id) === userId));
    return emp ? emp.name : "Unassigned";
  };

  const handleMarkDone = (id: string, customerName: string) => {
    markDoneMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Visit Completed", description: `Cleaning visit for ${customerName} logged successfully.` });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      }
    });
  };

  const handleUpdateVisit = () => {
    if (!editingVisit || !newDate) return;
    updateVisitMutation.mutate({ 
      id: editingVisit.id, 
      scheduledDate: newDate,
      scheduledTime: newTime || undefined,
      assignedEmployeeId: editingVisit.assignedEmployeeId === "none" ? null : editingVisit.assignedEmployeeId
    }, {
      onSuccess: () => {
        toast({ title: "Visit Updated", description: "Schedule and assignment saved successfully." });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["amc-visits"] });
        setEditingVisit(null);
      }
    });
  };

  const filteredUpcoming = visits.filter(v => {
    if (v.status !== "pending") return false;
    const date = new Date(v.scheduledDate);
    
    if (filterDate) {
      return isSameDay(date, new Date(filterDate));
    }
    
    if (filterMonth !== "all") {
      return date.getMonth() === parseInt(filterMonth);
    }
    
    return true;
  }).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  const completedVisits = visits.filter(v => v.status === "completed");

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-3 px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[150px] h-9 bg-white">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((m, i) => (
                  <SelectItem key={m} value={String(i)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Input 
                type="date" 
                className="h-9 w-[180px] bg-white pr-8"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              {filterDate && (
                <button 
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setFilterDate("")}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <Button 
            variant={showLogs ? "default" : "outline"}
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            {showLogs ? "Hide Visit Logs" : "Show Visit Logs"}
          </Button>
        </CardHeader>
      </Card>

      <div className={`grid grid-cols-1 ${showLogs ? "md:grid-cols-3" : ""} gap-6 transition-all duration-300`}>
        <Card className={`${showLogs ? "md:col-span-2" : "col-span-1"} shadow-sm border-slate-200`}>
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">Upcoming Cleanings</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {filteredUpcoming.length} Pending
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[550px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer / Site</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10">Loading schedule...</TableCell></TableRow>
                  ) : filteredUpcoming.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500 italic">No matching visits found.</TableCell></TableRow>
                  ) : (
                    filteredUpcoming.map((visit) => (
                      <TableRow key={visit.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <div className="font-medium">{visit.customer?.fullName}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                            <MapPin className="h-3 w-3" /> {visit.customer?.city}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="text-sm font-semibold text-slate-700">
                                {format(new Date(visit.scheduledDate), "dd MMM yyyy")}
                              </div>
                              <div className="text-[10px] text-slate-400">Scheduled Visit</div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-slate-400 hover:text-primary"
                              onClick={() => {
                                setEditingVisit(visit);
                                setNewDate(format(new Date(visit.scheduledDate), "yyyy-MM-dd"));
                                setNewTime(visit.scheduledTime || "");
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 w-fit">
                            <User className="h-3 w-3 text-slate-400" />
                            {getEmployeeName(visit.assignedEmployeeId || "")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                            Pending
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-8 gap-1.5 bg-white border shadow-sm hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                            onClick={() => handleMarkDone(visit.id, visit.customer?.fullName || "Customer")}
                            disabled={markDoneMutation.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Mark Done
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {showLogs && (
          <Card className="shadow-sm border-slate-200 animate-in fade-in slide-in-from-right-4 duration-300">
            <CardHeader className="border-b bg-slate-50/50 py-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-slate-500" />
                <CardTitle className="text-lg font-semibold">Visit Logs ({currentYear})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-6">
                  {months.map((m, monthIndex) => {
                    const monthlyLogs = completedVisits.filter(v => 
                      new Date(v.completedAt || v.scheduledDate).getMonth() === monthIndex &&
                      new Date(v.completedAt || v.scheduledDate).getFullYear() === currentYear
                    );
                    
                    if (monthlyLogs.length === 0) return null;

                    return (
                      <div key={m} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-700">{m}</span>
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {monthlyLogs.length} Done
                          </span>
                        </div>
                        <div className="space-y-1.5 pl-3 border-l-2 border-slate-100">
                          {monthlyLogs.map(v => (
                            <div key={v.id} className="text-xs flex justify-between items-center text-slate-600 py-1 border-b border-slate-50 last:border-0">
                              <span className="truncate max-w-[150px] font-medium">{v.customer?.fullName}</span>
                              <span className="font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded text-slate-400">
                                {format(new Date(v.completedAt || v.scheduledDate), "dd/MM")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {completedVisits.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-sm text-slate-400 italic">No logs recorded for {currentYear}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!editingVisit} onOpenChange={(open) => !open && setEditingVisit(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Cleaning Visit</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer</label>
              <Input value={editingVisit?.customer?.fullName || ""} disabled className="bg-slate-50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary flex items-center gap-2">
                <Calendar className="h-4 w-4" /> New Scheduled Date
              </label>
              <Input 
                type="date" 
                value={newDate} 
                onChange={(e) => setNewDate(e.target.value)} 
                className="border-primary/20 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                Visit Time
                <span className="text-[10px] text-slate-400 font-normal">(optional)</span>
              </label>
              <Input 
                type="time" 
                value={newTime} 
                onChange={(e) => setNewTime(e.target.value)} 
                className="border-slate-200 focus-visible:ring-primary"
              />
              {newTime && (
                <p className="text-[11px] text-slate-500">
                  Visit at <span className="font-semibold text-slate-700">{newTime}</span> — will appear on calendar at this exact time.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" /> Assign Technician
              </label>
              <Select 
                value={editingVisit?.assignedEmployeeId || "none"} 
                onValueChange={(val) => setEditingVisit({...editingVisit, assignedEmployeeId: val})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific assignment</SelectItem>
                  {filteredEmployees.map(emp => (
                    <SelectItem key={emp.id} value={String(emp.userId || emp.id)}>{emp.name} ({emp.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVisit(null)}>Cancel</Button>
            <Button onClick={handleUpdateVisit} disabled={updateVisitMutation.isPending}>
              {updateVisitMutation.isPending ? "Updating..." : "Confirm Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
