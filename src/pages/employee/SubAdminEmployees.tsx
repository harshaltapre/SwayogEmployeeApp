import { Users, IndianRupee, CheckCircle, Star, MapPin, Download, Plus, LayoutGrid, List, ChevronRight, ClipboardList, Calendar, Clock, Phone, User as UserIcon, Compass, Camera, Eye } from "lucide-react";
import { useListEmployees, useListTasks, buildAssetUrlFromPath } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { EmployeeDetailContent } from "@/components/employees/EmployeeDetailContent";
import { SubAdminLayout } from "@/components/subadmin/SubAdminLayout";
import { AssignSiteVisitModal } from "@/components/subadmin/AssignSiteVisitModal";
import { roleLabel } from "../superadmin/UsersTab";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

export default function SubAdminEmployees() {
  const { data: rawEmployees, isLoading: employeesLoading, refetch: refetchEmployees } = useListEmployees();
  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useListTasks(undefined, { query: { refetchInterval: 3000 } });
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [viewSiteVisitTask, setViewSiteVisitTask] = useState<any | null>(null);
  const [outerTab, setOuterTab] = useState("directory");
  const [innerTab, setInnerTab] = useState("all");

  const employees = rawEmployees?.filter(e => 
    [
      "electrical engineer", "electrical_engineer", 
      "site survey engineer", "site_survey_engineer", 
      "o&m technician", "om_technician", 
      "service engineer", "service_engineer", 
      "field technician", "field_technician", 
      "technician", "intern", "employee"
    ].includes(String(e.role || "").toLowerCase())
  );

  const isLoading = employeesLoading || tasksLoading;

  if (selectedEmployeeId) {
    return (
      <SubAdminLayout>
        <EmployeeDetailContent 
          id={selectedEmployeeId} 
          onBack={() => setSelectedEmployeeId(null)} 
          hideHeader
        />
      </SubAdminLayout>
    );
  }

  const avgRating = employees?.length 
    ? (employees.reduce((s, e) => s + e.rating, 0) / employees.length).toFixed(1) 
    : "0.0";

  return (
    <SubAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employee Section</h1>
            <p className="text-muted-foreground mt-1">
              Manage staff and track assigned tasks.
            </p>
          </div>
          <Button 
            onClick={() => setAssignModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-sm shrink-0 h-10 px-4"
          >
            <Compass className="h-4 w-4" /> Assign Site Visit
          </Button>
        </div>

        <Tabs value={outerTab} onValueChange={setOuterTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-slate-100 p-1">
            <TabsTrigger value="directory" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Users size={16} className="mr-2" /> Staff Directory
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ClipboardList size={16} className="mr-2" /> Assigned Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="directory" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full max-w-3xl">
                <Card className="bg-primary/5 border-primary/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Users size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Total Staff</p>
                        <p className="text-xl font-bold">{employeesLoading ? "..." : employees?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50/50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-100 rounded-lg text-green-700">
                        <Star size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Avg Rating</p>
                        <p className="text-xl font-bold text-green-700">{employeesLoading ? "..." : `${avgRating} ★`}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex items-center gap-2 bg-muted p-1 rounded-md h-fit">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 gap-1.5 font-bold px-3"
                >
                  <LayoutGrid size={14} /> Grid
                </Button>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-8 gap-1.5 font-bold px-3"
                >
                  <List size={14} /> Table
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
              {viewMode === "grid" ? (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-xl" />)
                  ) : employees?.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">No employees found.</div>
                  ) : (
                    employees?.map(e => (
                      <div key={e.id} className="border rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                        <div className="bg-slate-900 p-5 flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-xl">
                            {e.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-bold truncate">{e.name}</p>
                            <p className="text-slate-400 text-xs font-medium">{roleLabel(e.role as any)}</p>
                          </div>
                          <Badge className={`ml-auto capitalize ${e.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`} variant="outline">
                            {e.status}
                          </Badge>
                        </div>
                        <div className="p-5 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zone</p>
                              <div className="flex items-center gap-1 text-sm font-bold text-slate-700 mt-1">
                                <MapPin size={12} className="text-slate-400" /> {e.zone}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Tasks</p>
                              <p className="text-sm font-bold text-slate-700 mt-1">{e.activeTasksCount || 0}</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            className="w-full text-xs font-bold gap-2 h-9 border-slate-200"
                            onClick={() => setSelectedEmployeeId(e.id)}
                          >
                            View Assigned Tasks <ChevronRight size={14} />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {["Name", "Role", "Zone", "Active Tasks", "Rating", "Status", "Actions"].map(h => (
                          <th key={h} className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {employeesLoading ? (
                        <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">Loading staff...</td></tr>
                      ) : employees?.length === 0 ? (
                        <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No employees found.</td></tr>
                      ) : (
                        employees?.map(e => (
                          <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900">{e.name}</div>
                              <div className="text-xs text-slate-500">{e.email}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{roleLabel(e.role as any)}</td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-600">
                              <div className="flex items-center gap-1.5"><MapPin size={13} className="text-slate-400" /> {e.zone}</div>
                            </td>
                            <td className="px-6 py-4 text-sm font-black text-slate-900">{e.activeTasksCount || 0}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
                                <Star size={14} fill="currentColor" /> {e.rating}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={`capitalize ${e.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`} variant="outline">
                                {e.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-xs font-bold text-primary hover:bg-primary/5"
                                onClick={() => setSelectedEmployeeId(e.id)}
                              >
                                View Tasks
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Tabs value={innerTab} onValueChange={setInnerTab} className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-slate-100 p-1 h-9">
                  <TabsTrigger value="all" className="text-xs h-7">All Tasks</TabsTrigger>
                  <TabsTrigger value="site-visits" className="text-xs h-7 font-bold text-emerald-700 bg-emerald-50/50">📍 Site Visits</TabsTrigger>
                  <TabsTrigger value="today" className="text-xs h-7">Today</TabsTrigger>
                  <TabsTrigger value="upcoming" className="text-xs h-7">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs h-7">Completed</TabsTrigger>
                </TabsList>
              </div>

              {[
                { value: "all", label: "Total Assignments", data: tasks ?? [] },
                { value: "site-visits", label: "Site Visit Tasks", data: tasks?.filter(t => t.jobType === "Site Visit" || t.jobType?.toLowerCase().includes("site") || t.jobType?.toLowerCase().includes("visit")) ?? [] },
                { value: "today", label: "Today Tasks", data: tasks?.filter(t => (t.scheduledTime.startsWith(format(new Date(), "yyyy-MM-dd")) || t.scheduledTime < format(new Date(), "yyyy-MM-dd")) && t.status !== "completed") ?? [] },
                { value: "upcoming", label: "Upcoming Tasks", data: tasks?.filter(t => t.scheduledTime > format(new Date(), "yyyy-MM-dd") && t.status !== "completed" && !t.scheduledTime.startsWith(format(new Date(), "yyyy-MM-dd"))) ?? [] },
                { value: "completed", label: "Completed Tasks", data: tasks?.filter(t => t.status === "completed") ?? [] }
              ].map(({ value, label, data: filteredTasks }) => (
                <TabsContent key={value} value={value} className="mt-0">
                  <div className="flex items-center justify-end mb-4 -mt-12">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold px-3 py-1">
                      {filteredTasks.length} {label}
                    </Badge>
                  </div>
                  <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            {["Task / Site Info", "Assigned Staff", "Status", "Scheduled Time", "Customer / Site Contact", "Actions"].map(h => (
                              <th key={h} className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tasksLoading ? (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Loading tasks...</td></tr>
                          ) : filteredTasks.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-20 text-center text-muted-foreground bg-slate-50/30">
                              <div className="flex flex-col items-center gap-2">
                                <ClipboardList className="h-10 w-10 text-slate-200" />
                                <p className="font-medium text-slate-400">No {value === "all" ? "" : value === "site-visits" ? "site visit" : value} tasks found.</p>
                              </div>
                            </td></tr>
                          ) : (
                            filteredTasks.map(task => {
                              const assignedEmp = rawEmployees?.find(emp => 
                                emp.userId === task.employeeUserId || 
                                String(emp.id) === String(task.employeeUserId) || 
                                emp.loginId === task.employeeUserId ||
                                emp.email === task.employeeUserId
                              );
                              const isSiteVisit = task.jobType === "Site Visit" || task.jobType?.toLowerCase().includes("site") || task.jobType?.toLowerCase().includes("visit");
                              return (
                                <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                      <Badge className={`text-[10px] font-bold px-2 py-0.5 border ${
                                        isSiteVisit 
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                          : 'bg-slate-100 text-slate-800 border-slate-300'
                                      }`}>
                                        {isSiteVisit ? "📍 Site Visit" : task.jobType}
                                      </Badge>
                                      <span className="text-[10px] text-slate-400 font-mono">#{task.id}</span>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-800 mt-1 line-clamp-2">{task.description}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    {assignedEmp ? (
                                      <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold border border-emerald-200">
                                          {assignedEmp.name.charAt(0)}
                                        </div>
                                        <div>
                                          <div className="text-sm font-bold text-slate-900">{assignedEmp.name}</div>
                                          <div className="text-[10px] text-slate-500">{roleLabel(assignedEmp.role as any)}</div>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 text-xs italic">Unassigned</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge className={`capitalize text-[10px] px-2 py-0 h-5 border-none shadow-none ${
                                      task.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                      'bg-amber-100 text-amber-700'
                                    }`} variant="outline">
                                      {task.status.replace('_', ' ')}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                      <Calendar size={13} className="text-slate-400" />
                                      {format(new Date(task.scheduledTime), "MMM d, yyyy")}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                                      <Clock size={11} />
                                      {format(new Date(task.scheduledTime), "h:mm a")}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-slate-900">{task.customerName}</div>
                                    {task.customerPhone && task.customerPhone !== "0000000000" && (
                                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                        <Phone size={10} /> {task.customerPhone}
                                      </div>
                                    )}
                                    <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mt-0.5 max-w-xs">
                                      <MapPin size={11} className="text-red-500 shrink-0" /> <span className="truncate">{task.address}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {isSiteVisit && (() => {
                                        const totalPhotosCount = Array.from(new Set([
                                          ...(Array.isArray(task.sitePhotos) ? task.sitePhotos : []),
                                          ...(Array.isArray(task.taskImages) ? task.taskImages.map((i: any) => i.url).filter(Boolean) : []),
                                          ...(task.beforeImageUrl ? [task.beforeImageUrl] : []),
                                          ...(task.afterImageUrl ? [task.afterImageUrl] : []),
                                        ])).length;

                                        return (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-[10px] font-bold text-emerald-800 bg-emerald-50 border-emerald-300 hover:bg-emerald-100 gap-1 shadow-2xs"
                                            onClick={() => setViewSiteVisitTask(task)}
                                          >
                                            <Camera size={12} className="text-emerald-700" />
                                            Site Photos ({totalPhotosCount})
                                          </Button>
                                        );
                                      })()}
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 text-[10px] font-black uppercase tracking-tight text-primary hover:bg-primary/5"
                                        onClick={() => {
                                          if (assignedEmp) setSelectedEmployeeId(assignedEmp.id);
                                        }}
                                      >
                                        Profile
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      <AssignSiteVisitModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        employees={rawEmployees || []}
        onSuccess={() => {
          refetchEmployees();
          refetchTasks();
          // Auto-navigate to Site Visits tab to show the newly created task
          setOuterTab("tasks");
          setInnerTab("site-visits");
        }}
      />

      {/* Service Coordinator Site Visit Task Details & Photos Gallery Modal */}
      <Dialog open={!!viewSiteVisitTask} onOpenChange={(open) => !open && setViewSiteVisitTask(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewSiteVisitTask && (() => {
            const activeTask = tasks?.find(t => String(t.id) === String(viewSiteVisitTask.id)) || viewSiteVisitTask;
            const assignedEmp = rawEmployees?.find(emp => 
              emp.userId === activeTask.employeeUserId || 
              String(emp.id) === String(activeTask.employeeUserId) || 
              emp.loginId === activeTask.employeeUserId ||
              emp.email === activeTask.employeeUserId
            );
            const photos: string[] = Array.from(new Set([
              ...(Array.isArray(activeTask.sitePhotos) ? activeTask.sitePhotos : []),
              ...(Array.isArray(activeTask.taskImages) ? activeTask.taskImages.map((img: any) => img.url).filter(Boolean) : []),
              ...(activeTask.beforeImageUrl ? [activeTask.beforeImageUrl] : []),
              ...(activeTask.afterImageUrl ? [activeTask.afterImageUrl] : []),
            ]));

            return (
              <div className="space-y-6">
                <DialogHeader className="border-b pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs">
                      📍 Site Visit Task #{viewSiteVisitTask.id}
                    </Badge>
                    <Badge className="capitalize bg-slate-100 text-slate-800 border-slate-200 text-xs">
                      {viewSiteVisitTask.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <DialogTitle className="text-xl font-bold text-slate-900">
                    {viewSiteVisitTask.description}
                  </DialogTitle>
                </DialogHeader>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Staff</span>
                    <div className="font-bold text-slate-900 text-base mt-0.5">{assignedEmp?.name || "Unassigned"}</div>
                    <div className="text-xs text-slate-500">{assignedEmp?.role || "Employee"}</div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Date & Time</span>
                    <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {format(new Date(viewSiteVisitTask.scheduledTime), "PPP 'at' p")}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Contact</span>
                    <div className="font-bold text-slate-900 mt-0.5">{viewSiteVisitTask.customerName}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {viewSiteVisitTask.customerPhone}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Site Location</span>
                    <div className="font-medium text-slate-700 mt-0.5 flex items-start gap-1">
                      <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{viewSiteVisitTask.address}</span>
                    </div>
                  </div>
                </div>

                {/* Min 4 - Max 10 Site Visit Photos Gallery */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Camera className="h-4 w-4 text-emerald-600" />
                      Site Visit Photos ({photos.length} Photos Uploaded)
                    </h3>
                    <Badge variant="outline" className={photos.length >= 4 ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold" : "bg-amber-50 text-amber-800 border-amber-300 font-bold"}>
                      📸 {photos.length} Photos (Min 4 - Max 10)
                    </Badge>
                  </div>

                  {photos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {photos.map((photoUrl, idx) => {
                        const fullUrl = buildAssetUrlFromPath(photoUrl) || photoUrl;
                        return (
                          <div key={idx} className="group relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 aspect-video">
                            <img
                              src={fullUrl}
                              alt={`Site Photo ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 p-2 flex flex-col justify-between">
                              <span className="self-end bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                                Photo #{idx + 1}
                              </span>
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 py-1 px-2 rounded flex items-center justify-center gap-1 shadow transition-colors"
                              >
                                <Eye className="h-3 w-3" /> View Full Image
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400">
                      <Camera className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="text-xs font-semibold text-slate-500">No site photos uploaded yet for this site visit task.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">The employee must upload 4 to 10 site photos from the Employee App/Section.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </SubAdminLayout>
  );
}
