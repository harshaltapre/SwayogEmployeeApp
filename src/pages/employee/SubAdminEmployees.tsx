import { Users, IndianRupee, CheckCircle, Star, MapPin, Download, Plus, LayoutGrid, List, ChevronRight, ClipboardList, Calendar, Clock, Phone, User as UserIcon } from "lucide-react";
import { useListEmployees, useListTasks } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { EmployeeDetailContent } from "@/components/employees/EmployeeDetailContent";
import { SubAdminLayout } from "@/components/subadmin/SubAdminLayout";
import { roleLabel } from "../superadmin/UsersTab";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function SubAdminEmployees() {
  const { data: rawEmployees, isLoading: employeesLoading, refetch: refetchEmployees } = useListEmployees();
  const { data: tasks, isLoading: tasksLoading } = useListTasks();
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employee Section</h1>
            <p className="text-muted-foreground mt-1">
              Manage staff and track assigned tasks.
            </p>
          </div>
        </div>

        <Tabs defaultValue="directory" className="w-full">
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
            <Tabs defaultValue="all" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-slate-100 p-1 h-9">
                  <TabsTrigger value="all" className="text-xs h-7">All Tasks</TabsTrigger>
                  <TabsTrigger value="today" className="text-xs h-7">Today</TabsTrigger>
                  <TabsTrigger value="upcoming" className="text-xs h-7">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs h-7">Completed</TabsTrigger>
                </TabsList>
                
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-bold px-3 py-1">
                  {tasks?.length || 0} Total Assignments
                </Badge>
              </div>

              {[
                { value: "all", data: tasks ?? [] },
                { value: "today", data: tasks?.filter(t => (t.scheduledTime.startsWith(format(new Date(), "yyyy-MM-dd")) || t.scheduledTime < format(new Date(), "yyyy-MM-dd")) && t.status !== "completed") ?? [] },
                { value: "upcoming", data: tasks?.filter(t => t.scheduledTime > format(new Date(), "yyyy-MM-dd") && t.status !== "completed" && !t.scheduledTime.startsWith(format(new Date(), "yyyy-MM-dd"))) ?? [] },
                { value: "completed", data: tasks?.filter(t => t.status === "completed") ?? [] }
              ].map(({ value, data: filteredTasks }) => (
                <TabsContent key={value} value={value} className="mt-0">
                  <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            {["Task Info", "Assigned To", "Status", "Scheduled At", "Customer", "Actions"].map(h => (
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
                                <p className="font-medium text-slate-400">No {value === "all" ? "" : value} tasks found.</p>
                              </div>
                            </td></tr>
                          ) : (
                            filteredTasks.map(task => {
                              const assignedEmp = rawEmployees?.find(emp => emp.userId === task.employeeUserId || String(emp.id) === task.employeeUserId);
                              return (
                                <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">{task.jobType}</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">#{task.id}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    {assignedEmp ? (
                                      <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
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
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                      <MapPin size={11} /> {task.address.split(',')[0]}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
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
    </SubAdminLayout>
  );
}
