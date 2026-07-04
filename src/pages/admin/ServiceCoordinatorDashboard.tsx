import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
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
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { useListTasks, useListCustomers, useListEmployees } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
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

export default function ServiceCoordinatorDashboard() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useListTasks({});
  const { data: customers } = useListCustomers({ limit: 200 });
  const { data: employees } = useListEmployees({ limit: 200 });

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

  const activeTasks = filteredTasks.filter(t => t.status === "assigned" || t.status === "in_progress");
  const completedTasks = filteredTasks.filter(t => t.status === "completed");
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
            <Button variant="outline" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
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
              <div>
                <h3 className="font-semibold text-sm text-slate-500 mb-2">Work Photos</h3>
                <div className="grid grid-cols-2 gap-3">
                  {task.beforeImageUrl && (
                    <div className="relative">
                      <img 
                        src={task.beforeImageUrl} 
                        alt="Before work" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        Before
                      </div>
                      {task.beforeLatitude && task.beforeLongitude && (
                        <a 
                          href={`https://www.google.com/maps?q=${task.beforeLatitude},${task.beforeLongitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
                        >
                          📍
                        </a>
                      )}
                    </div>
                  )}
                  {task.afterImageUrl && (
                    <div className="relative">
                      <img 
                        src={task.afterImageUrl} 
                        alt="After work" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        After
                      </div>
                      {task.afterLatitude && task.afterLongitude && (
                        <a 
                          href={`https://www.google.com/maps?q=${task.afterLatitude},${task.afterLongitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
                        >
                          📍
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {!task.beforeImageUrl && !task.afterImageUrl && (
                  <p className="text-sm text-slate-400 italic">No photos uploaded yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
