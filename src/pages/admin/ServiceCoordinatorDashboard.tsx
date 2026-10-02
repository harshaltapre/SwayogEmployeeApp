import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Camera,
  Star,
  IndianRupee,
  RefreshCw,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  TrendingUp,
  Plus,
  Video,
  Wrench
} from "lucide-react";
import { format } from "date-fns";
import { useListTasks, useListCustomers, useListEmployees, useCreateTaskAssignment, buildAssetUrlFromPath } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TaskWithDetails {
  id: number;
  jobType: string;
  description: string;
  customerName: string;
  customerPhone: string;
  address: string;
  status: string;
  scheduledTime: string;
  completedAt?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  beforeLatitude?: number;
  beforeLongitude?: number;
  afterLatitude?: number;
  afterLongitude?: number;
  sitePhotos?: string[];
  maintenanceVideos?: string[];
  photoRemarks?: Record<number, string> | Record<string, string> | null;
  customerRating?: number;
  customerFeedback?: string;
  fixCharges?: number;
  taskRate?: number;
  siteName?: string;
  taskAssignments?: Array<{
    employeeUserId: string;
    status: string;
    employee?: {
      name: string;
      email: string;
      phone: string;
    };
  }>;
}

const normalizePhotoRemarks = (remarks: Record<number, string> | Record<string, string> | null | undefined): Record<number, string> => {
  if (!remarks || typeof remarks !== "object") return {};
  return Object.entries(remarks).reduce((acc, [key, value]) => {
    const index = Number(key);
    if (Number.isInteger(index) && typeof value === "string" && value.trim()) {
      acc[index] = value.trim();
    }
    return acc;
  }, {} as Record<number, string>);
};

export default function ServiceCoordinatorDashboard() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [maintenanceTask, setMaintenanceTask] = useState("");
  const [maintenanceAddress, setMaintenanceAddress] = useState("");
  const [maintenancePhone, setMaintenancePhone] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  
  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useListTasks({}, { query: { refetchInterval: 3000 } });
  const { data: customers } = useListCustomers({ limit: 200 });
  const { data: employees } = useListEmployees({ limit: 200 });
  const createTaskMutation = useCreateTaskAssignment();

  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = 
      task.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.jobType?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || task.status.toLowerCase() === statusFilter;
    
    let matchesDate = true;
    if (dateFilter === "today") {
      matchesDate = new Date(task.scheduledTime).toDateString() === new Date().toDateString();
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(task.scheduledTime) >= weekAgo;
    } else if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = new Date(task.scheduledTime) >= monthAgo;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  }) || [];

  const activeTasks = filteredTasks.filter(t => String(t.status).toLowerCase() === "assigned" || String(t.status).toLowerCase() === "in_progress");
  const completedTasks = filteredTasks.filter(t => String(t.status).toLowerCase() === "completed");
  const todayTasks = filteredTasks.filter(t => 
    new Date(t.scheduledTime).toDateString() === new Date().toDateString()
  );

  const totalRevenue = completedTasks.reduce((sum, task) => sum + (task.fixCharges || 0), 0);
  const avgRating = completedTasks.length > 0 
    ? completedTasks.reduce((sum, task) => sum + (task.customerRating || 0), 0) / completedTasks.length 
    : 0;

  const handleRefresh = () => {
    refetchTasks();
    toast({ title: "Refreshed", description: "Task data has been updated." });
  };

  const handleMaintenanceVisitSubmit = async () => {
    if (!selectedEmployee || !maintenanceTask.trim() || !maintenanceAddress.trim() || !maintenancePhone.trim() || !scheduledDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const scheduledDateTime = new Date(scheduledDate);
      scheduledDateTime.setHours(9, 0, 0, 0); // Default to 9 AM

      await createTaskMutation.mutateAsync({
        data: {
          employeeUserId: selectedEmployee,
          jobType: "Maintenance Visit",
          description: maintenanceTask.trim(),
          customerName: "Maintenance Customer",
          customerPhone: maintenancePhone.trim(),
          address: maintenanceAddress.trim(),
          scheduledTime: scheduledDateTime.toISOString(),
        },
      });

      toast({
        title: "Maintenance Visit Assigned",
        description: "Task has been successfully assigned to the employee.",
      });

      // Reset form
      setSelectedEmployee("");
      setMaintenanceTask("");
      setMaintenanceAddress("");
      setMaintenancePhone("");
      setScheduledDate("");
      setIsMaintenanceModalOpen(false);
      refetchTasks();
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign maintenance visit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openTaskDetail = (task: TaskWithDetails) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Service Coordinator Dashboard"
          description="Monitor tasks, track progress, view images, and manage payments"
          action={
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsMaintenanceModalOpen(true)} 
                className="gap-2 bg-emerald-600 hover:bg-emerald-500"
              >
                <Plus className="h-4 w-4" />
                Assign Maintenance Visit
              </Button>
              <Button variant="outline" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          }
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Active Tasks</p>
                  <p className="text-3xl font-bold mt-1">{activeTasks.length}</p>
                </div>
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed Today</p>
                  <p className="text-3xl font-bold mt-1">
                    {completedTasks.filter(t => 
                      t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold mt-1">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                  <IndianRupee className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Avg Rating</p>
                  <p className="text-3xl font-bold mt-1">{avgRating.toFixed(1)}</p>
                </div>
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Star className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, task type, or description..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Task Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              Active Tasks ({activeTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedTasks.length})
            </TabsTrigger>
            <TabsTrigger value="today">
              Today ({todayTasks.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Tasks ({filteredTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <TaskList tasks={activeTasks} onTaskClick={openTaskDetail} isLoading={tasksLoading} />
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <TaskList tasks={completedTasks} onTaskClick={openTaskDetail} isLoading={tasksLoading} />
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            <TaskList tasks={todayTasks} onTaskClick={openTaskDetail} isLoading={tasksLoading} />
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <TaskList tasks={filteredTasks} onTaskClick={openTaskDetail} isLoading={tasksLoading} />
          </TabsContent>
        </Tabs>

        {/* Task Detail Modal */}
        {selectedTask && (
          <TaskDetailModal 
            task={selectedTask} 
            open={isDetailModalOpen} 
            onOpenChange={setIsDetailModalOpen}
          />
        )}

        {/* Maintenance Visit Assignment Modal */}
        <Dialog open={isMaintenanceModalOpen} onOpenChange={setIsMaintenanceModalOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl border-none shadow-2xl bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-600" /> Assign Maintenance Visit
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Assign a maintenance visit task to an employee with image and video upload requirements.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100/60 px-2 py-1 rounded w-fit">Select Employee</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((emp) => (
                      <SelectItem key={emp.userId || emp.id} value={emp.userId || String(emp.id)}>
                        {emp.name} - {emp.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100/60 px-2 py-1 rounded w-fit">Task Description</label>
                <Textarea
                  value={maintenanceTask}
                  onChange={(e) => setMaintenanceTask(e.target.value)}
                  placeholder="Describe the maintenance task..."
                  className="min-h-[100px] p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-medium bg-slate-50/50 resize-none text-slate-800 leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100/60 px-2 py-1 rounded w-fit">Customer Phone</label>
                <Input
                  value={maintenancePhone}
                  onChange={(e) => setMaintenancePhone(e.target.value)}
                  placeholder="Customer phone number"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-semibold text-slate-800 bg-slate-50/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100/60 px-2 py-1 rounded w-fit">Address</label>
                <Textarea
                  value={maintenanceAddress}
                  onChange={(e) => setMaintenanceAddress(e.target.value)}
                  placeholder="Visit address..."
                  className="min-h-[80px] p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-medium bg-slate-50/50 resize-none text-slate-800 leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100/60 px-2 py-1 rounded w-fit">Scheduled Date</label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-semibold text-slate-800 bg-slate-50/50"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="font-bold rounded-xl px-5"
                disabled={createTaskMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleMaintenanceVisitSubmit}
                className="font-bold rounded-xl gap-2 px-5 bg-emerald-600 text-white hover:bg-emerald-500"
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? (
                  "Assigning..."
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Assign Task
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  );
}

function TaskList({ tasks, onTaskClick, isLoading }: { 
  tasks: TaskWithDetails[], 
  onTaskClick: (task: TaskWithDetails) => void,
  isLoading: boolean 
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No tasks found matching your filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => (
        <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onTaskClick(task)}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={task.status.toLowerCase()} />
                  <span className="text-sm font-medium text-slate-600">{task.jobType}</span>
                  {task.jobType === "Maintenance Visit" && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                      Maintenance
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{task.description}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {task.customerName}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {task.customerPhone}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {task.address}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.scheduledTime), "MMM d, yyyy h:mm a")}
                  </div>
                  {task.beforeImageUrl && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Camera className="h-3 w-3" />
                      Before photo
                    </div>
                  )}
                  {task.afterImageUrl && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Camera className="h-3 w-3" />
                      After photo
                    </div>
                  )}
                  {task.customerRating && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Star className="h-3 w-3" />
                      {task.customerRating}/5
                    </div>
                  )}
                </div>
              </div>
              {task.fixCharges && (
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">₹{task.fixCharges.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">Fix charges</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TaskDetailModal({ task, open, onOpenChange }: { 
  task: TaskWithDetails, 
  open: boolean, 
  onOpenChange: (open: boolean) => void 
}) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${open ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{task.description}</h2>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={task.status.toLowerCase()} />
                <span className="text-sm text-slate-600">{task.jobType}</span>
                {task.jobType === "Maintenance Visit" && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                    <Wrench className="h-3 w-3 mr-1" />
                    Maintenance
                  </Badge>
                )}
              </div>
            </div>
            <button onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-slate-500 mb-2">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    {task.customerName}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {task.customerPhone}
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    {task.address}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-slate-500 mb-2">Schedule</h3>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {format(new Date(task.scheduledTime), "MMMM d, yyyy 'at' h:mm a")}
                </div>
              </div>

              {task.customerRating && (
                <div>
                  <h3 className="font-semibold text-sm text-slate-500 mb-2">Customer Rating</h3>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <span className="text-lg font-bold">{task.customerRating}/5</span>
                  </div>
                  {task.customerFeedback && (
                    <p className="text-sm text-slate-600 mt-1 italic">"{task.customerFeedback}"</p>
                  )}
                </div>
              )}

              {task.fixCharges && (
                <div>
                  <h3 className="font-semibold text-sm text-slate-500 mb-2">Payment</h3>
                  <div className="flex items-center gap-2 text-lg font-bold text-green-600">
                    <IndianRupee className="h-5 w-5" />
                    {task.fixCharges.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {(() => {
                const displaySitePhotos = Array.isArray(task.sitePhotos)
                  ? Array.from(new Set(task.sitePhotos.filter((url) => typeof url === "string" && url.trim().length > 0)))
                  : [];
                const photoRemarks = normalizePhotoRemarks(task.photoRemarks);

                return (
                  <div>
                    <h3 className="font-semibold text-sm text-slate-500 mb-2">
                      {displaySitePhotos.length > 0
                        ? `Site Visit Photos (${displaySitePhotos.length} Uploaded)`
                        : "Work Photos"}
                    </h3>
                    {displaySitePhotos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {displaySitePhotos.map((url, index) => {
                          const fullUrl = buildAssetUrlFromPath(url) || url;
                          const remark = photoRemarks[index];
                          return (
                            <div key={index} className="space-y-2">
                              <div className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video group">
                                <img 
                                  src={fullUrl} 
                                  alt={`Site Photo ${index + 1}`} 
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                  Photo #{index + 1}
                                </div>
                                <a 
                                  href={fullUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="absolute top-1 right-1 bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded opacity-90 hover:opacity-100"
                                >
                                  View
                                </a>
                              </div>
                              {remark && (
                                <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                                  <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-500 mb-1">Remark</div>
                                  <div className="text-xs text-slate-700 italic">{remark}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {task.beforeImageUrl && (
                          <div className="relative">
                            <img 
                              src={buildAssetUrlFromPath(task.beforeImageUrl) || task.beforeImageUrl} 
                              alt="Before Work" 
                              className="w-full h-32 object-cover rounded-lg border border-slate-200"
                            />
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                              Before Work
                            </div>
                          </div>
                        )}
                        {task.afterImageUrl && (
                          <div className="relative">
                            <img 
                              src={buildAssetUrlFromPath(task.afterImageUrl) || task.afterImageUrl} 
                              alt="After Work" 
                              className="w-full h-32 object-cover rounded-lg border border-slate-200"
                            />
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                              After Work
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Maintenance Videos Display */}
              {task.maintenanceVideos && Array.isArray(task.maintenanceVideos) && task.maintenanceVideos.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-slate-500 mb-2 flex items-center gap-2">
                    <Video className="h-4 w-4 text-blue-600" />
                    Maintenance Videos ({task.maintenanceVideos.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {task.maintenanceVideos.map((video, index) => {
                      const videoUrl = buildAssetUrlFromPath(video) || video;
                      return (
                        <div key={index} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video group">
                          <video 
                            src={videoUrl} 
                            className="w-full h-full object-cover" 
                            controls
                            preload="metadata"
                          />
                          <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                            Video #{index + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
