import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MapPin, Phone, History, CalendarDays, Filter, Calendar, Edit2, X, Clock, HelpCircle, AlertTriangle, Building2 } from "lucide-react";
import { useListAmcVisits, useMarkVisitDone, useUpdateAmcVisit, useListEmployees } from "@/lib/api-client";
import { format, isSameDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function AmcVisitTracker({
  customerId,
  customerName,
  onClearCustomer,
}: {
  customerId?: number;
  customerName?: string;
  onClearCustomer?: () => void;
}) {
  const { toast } = useToast();
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [editingVisit, setEditingVisit] = useState<any | null>(null);
  const [completingVisit, setCompletingVisit] = useState<any | null>(null);
  const [visitNotes, setVisitNotes] = useState<string>("");
  const [newDate, setNewDate] = useState<string>("");
  const [newTime, setNewTime] = useState<string>("");
  const [showExcessConfirm, setShowExcessConfirm] = useState(false);

  const queryClient = useQueryClient();
  const { data: visits = [], isLoading } = useListAmcVisits({ customerId });
  const { data: employees = [] } = useListEmployees();
  const markDoneMutation = useMarkVisitDone();
  const updateVisitMutation = useUpdateAmcVisit();

  const filteredEmployees = employees.filter(e => 
    [
      "electrical engineer", "electrical_engineer", 
      "site survey engineer", "site_survey_engineer", 
      "o&m technician", "om_technician", 
      "service engineer", "service_engineer", 
      "field technician", "field_technician", 
      "technician", "intern", "employee"
    ].includes(String(e.role || "").toLowerCase())
  );

  const getEmployeeName = (userId: string) => {
    const emp = employees.find(e => (e.userId === userId || String(e.id) === userId));
    return emp ? emp.name : "Unassigned";
  };

  const handleMarkDoneSubmit = () => {
    if (!completingVisit) return;
    
    markDoneMutation.mutate({ 
      id: completingVisit.id, 
      notes: visitNotes.trim() || undefined 
    }, {
      onSuccess: () => {
        toast({ 
          title: "Visit Completed", 
          description: `Cleaning visit logged successfully.` 
        });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["amc-visits"] });
        setCompletingVisit(null);
        setVisitNotes("");
      },
      onError: (error) => {
        toast({
          title: "Error Completing Visit",
          description: error instanceof Error ? error.message : "Failed to mark visit completed.",
          variant: "destructive"
        });
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

  const checkExcessAndSubmit = () => {
    if (!editingVisit || !newDate) return;
    const targetDate = new Date(newDate);
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    const visitsInTargetMonth = visits.filter(v => 
      v.id !== editingVisit.id &&
      new Date(v.scheduledDate).getMonth() === targetMonth &&
      new Date(v.scheduledDate).getFullYear() === targetYear
    );
    const limit = editingVisit.customer?.cleaningsPerMonth || 2;
    const willExceed = (visitsInTargetMonth.length + 1) > limit;
    if (willExceed) {
      setShowExcessConfirm(true);
    } else {
      handleUpdateVisit();
    }
  };

  // Filter both pending & completed cleanings
  const filteredVisits = visits.filter(v => {
    const date = new Date(v.scheduledDate);
    
    if (filterDate) {
      return isSameDay(date, new Date(filterDate));
    }
    
    if (filterMonth !== "all") {
      return date.getMonth() === parseInt(filterMonth);
    }
    
    return true;
  }).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  // Statistics calculation
  const totalCleanings = visits.length;
  const doneCount = visits.filter(v => v.status === "completed").length;
  const pendingCount = visits.filter(v => v.status === "pending").length;
  const overdueCount = visits.filter(v => 
    v.status === "pending" && new Date(v.scheduledDate) < new Date()
  ).length;

  const isOverdue = (visit: any) => {
    return visit.status === "pending" && new Date(visit.scheduledDate) < new Date();
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* 4 KPI card grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-50 border-slate-200 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Cleanings</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-800">{totalCleanings}</span>
              <CalendarDays className="h-5 w-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-emerald-50/40 border-emerald-100 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Completed</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-emerald-700">{doneCount}</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50/40 border-amber-100 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-amber-700">{pendingCount}</span>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={`${overdueCount > 0 ? "bg-rose-50/50 border-rose-100" : "bg-slate-50 border-slate-200"} shadow-sm`}>
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className={`text-[10px] font-bold ${overdueCount > 0 ? "text-rose-600" : "text-slate-500"} uppercase tracking-wider`}>Overdue</span>
            <div className="flex items-baseline justify-between">
              <span className={`text-3xl font-extrabold ${overdueCount > 0 ? "text-rose-700" : "text-slate-800"}`}>{overdueCount}</span>
              <AlertTriangle className={`h-5 w-5 ${overdueCount > 0 ? "text-rose-500" : "text-slate-400"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and settings bar */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-slate-50/50 py-3 px-6 gap-4">
          <div className="flex flex-wrap items-center gap-4">
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
                className="h-9 w-[180px] bg-white pr-8 text-xs"
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

          <div className="flex flex-wrap items-center gap-3">
            {customerName ? (
              <div className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Active Customer:</span>
                <span className="text-primary font-bold">{customerName}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-slate-600 rounded-full ml-1" onClick={onClearCustomer}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : null}

            <Button 
              variant={showLogs ? "default" : "outline"}
              size="sm"
              onClick={() => setShowLogs(!showLogs)}
              className="gap-2 text-xs"
            >
              <History className="h-4 w-4" />
              {showLogs ? "Hide Logs" : "Show Completion Logs"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className={`grid grid-cols-1 ${showLogs ? "md:grid-cols-4" : ""} gap-6 transition-all duration-300`}>
        <Card className={`${showLogs ? "md:col-span-3" : "col-span-1"} shadow-sm border-slate-200`}>
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">AMC Visit Schedules & History</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {filteredVisits.length} Records
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[550px]">
              <Table>
                <TableHeader className="bg-slate-50/40">
                  <TableRow>
                    <TableHead className="w-[80px]">Clean #</TableHead>
                    <TableHead>Customer / Site</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Done By</TableHead>
                    <TableHead>Actual Date & Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-10">Loading schedule...</TableCell></TableRow>
                  ) : filteredVisits.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-10 text-slate-500 italic">No matching visits found.</TableCell></TableRow>
                  ) : (
                    filteredVisits.map((visit) => {
                      const overdue = isOverdue(visit);
                      return (
                        <TableRow key={visit.id} className={`hover:bg-slate-50/50 ${visit.status === "completed" ? "bg-slate-50/30 text-slate-500" : ""}`}>
                          <TableCell className="font-semibold text-slate-700">
                            Visit #{visit.cleaningNumber || "—"}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-900">{visit.customer?.fullName}</div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              <span>{visit.customer?.city}</span>
                              {visit.customer?.apartment && (
                                <>
                                  <span>•</span>
                                  <Building2 className="h-3 w-3 text-indigo-500 shrink-0" />
                                  <span className="font-semibold text-indigo-600">{visit.customer.apartment.name}</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                              {format(new Date(visit.scheduledDate), "dd MMM yyyy")}
                              {overdue && (
                                <Badge variant="outline" className="text-[9px] border-rose-200 text-rose-600 bg-rose-50 px-1 py-0 font-bold ml-1 animate-pulse">
                                  ⚠ Overdue
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-medium text-slate-600">
                            {visit.timeSlot || "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                              <User className="h-3 w-3 text-slate-400" />
                              <span>{getEmployeeName(visit.assignedEmployeeId || "")}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                visit.status === "completed" 
                                  ? "bg-green-50 text-green-700 border-green-200" 
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }
                            >
                              {visit.status === "completed" ? "Done" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-slate-700">
                            {visit.completedByName || "—"}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {visit.completedAt ? (
                              <div className="space-y-0.5">
                                <div className="text-slate-700">{format(new Date(visit.completedAt), "dd MMM yyyy")}</div>
                                <div className="text-slate-400 text-[10px]">{format(new Date(visit.completedAt), "hh:mm a")}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {visit.status === "pending" ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-400 hover:text-primary border border-transparent hover:border-slate-200"
                                  onClick={() => {
                                    setEditingVisit(visit);
                                    setNewDate(format(new Date(visit.scheduledDate), "yyyy-MM-dd"));
                                    setNewTime(visit.timeSlot || "");
                                  }}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="secondary" 
                                  className="h-8 gap-1 bg-white border shadow-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-semibold"
                                  onClick={() => {
                                    setCompletingVisit(visit);
                                    setVisitNotes("");
                                  }}
                                  disabled={markDoneMutation.isPending}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark Done
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Logged</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {showLogs && (
          <Card className="shadow-sm border-slate-200 animate-in fade-in slide-in-from-right-4 duration-300 col-span-1">
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
                    const monthlyLogs = visits.filter(v => 
                      v.status === "completed" &&
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
                  {visits.filter(v => v.status === "completed").length === 0 && (
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

      {/* Completion Dialog with Notes */}
      <Dialog open={!!completingVisit} onOpenChange={(open) => !open && setCompletingVisit(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-slate-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Log Visit Completion
            </DialogTitle>
            <DialogDescription>
              Mark cleaning visit #{completingVisit?.cleaningNumber} for <span className="font-semibold text-slate-700">{completingVisit?.customer?.fullName}</span> as completed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Scheduled Date</label>
              <Input 
                value={completingVisit?.scheduledDate ? format(new Date(completingVisit.scheduledDate), "dd MMM yyyy") : ""} 
                disabled 
                className="bg-slate-50" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-slate-700">Completion Notes / Remarks (Optional)</Label>
              <Textarea 
                id="notes" 
                placeholder="Enter details about panel cleanliness, any issues spotted, etc." 
                value={visitNotes} 
                onChange={(e) => setVisitNotes(e.target.value)} 
                className="min-h-[100px] border-slate-200 focus-visible:ring-emerald-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletingVisit(null)}>Cancel</Button>
            <Button 
              onClick={handleMarkDoneSubmit} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={markDoneMutation.isPending}
            >
              {markDoneMutation.isPending ? "Logging..." : "Confirm & Mark Done"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={!!editingVisit} onOpenChange={(open) => !open && setEditingVisit(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Cleaning Visit</DialogTitle>
            <DialogDescription>Update the visit date, time, and technician assignment</DialogDescription>
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
                Visit Time (Time Slot)
                <span className="text-[10px] text-slate-400 font-normal">(optional)</span>
              </label>
              <Input 
                type="text" 
                placeholder="e.g. 09:00 AM or 14:00"
                value={newTime} 
                onChange={(e) => setNewTime(e.target.value)} 
                className="border-slate-200 focus-visible:ring-primary text-xs"
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
            <Button onClick={checkExcessAndSubmit} disabled={updateVisitMutation.isPending}>
              {updateVisitMutation.isPending ? "Updating..." : "Confirm Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excess Cleaning Scheduling Warning Dialog */}
      <Dialog open={showExcessConfirm} onOpenChange={setShowExcessConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Excess Cleanings Limit Reached
            </DialogTitle>
            <DialogDescription className="pt-2">
              This customer is allotted <span className="font-bold text-slate-800">{editingVisit?.customer?.cleaningsPerMonth || 2} cleanings</span> per month.
              <div className="mt-2 p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-xs leading-normal">
                This customer already has <span className="font-semibold text-slate-800">{visits.filter(v => v.id !== editingVisit?.id && new Date(v.scheduledDate).getMonth() === new Date(newDate).getMonth() && new Date(v.scheduledDate).getFullYear() === new Date(newDate).getFullYear()).length} cleaning(s)</span> scheduled/done in the selected month ({new Date(newDate).toLocaleString('default', { month: 'long' }) + " " + new Date(newDate).getFullYear()}).
              </div>
              <p className="mt-3 font-semibold text-slate-700">
                This number of cleaning is done. Want to schedule more then continue?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowExcessConfirm(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              onClick={() => {
                setShowExcessConfirm(false);
                handleUpdateVisit();
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
