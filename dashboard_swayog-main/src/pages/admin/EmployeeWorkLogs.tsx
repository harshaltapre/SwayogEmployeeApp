import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { format } from "date-fns";
import { CheckCircle, Clock, User, Calendar, MessageSquare, Inbox } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

interface EmployeeWorkLog {
  id: number;
  employeeId: number;
  employeeName: string;
  description: string;
  timestamp: string;
  status: "sent_to_admin" | "read" | "acknowledged";
}

// Mock data for demonstration
const mockEmployeeWorkLogs: EmployeeWorkLog[] = [];

export default function EmployeeWorkLogs() {
  const [workLogs, setWorkLogs] = useState<EmployeeWorkLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<EmployeeWorkLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "sent_to_admin" | "read" | "acknowledged">("all");
  const [filterEmployee, setFilterEmployee] = useState("all");

  useEffect(() => {
    // Load from mock data and localStorage if available
    const storedLogs = localStorage.getItem("employee_work_logs");
    const logs = storedLogs ? JSON.parse(storedLogs) : [];
    
    // Combine mock data with stored data
    const allLogs = [...mockEmployeeWorkLogs, ...logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    setWorkLogs(allLogs);
  }, []);

  useEffect(() => {
    let filtered = workLogs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((log) => log.status === filterStatus);
    }

    // Filter by employee
    if (filterEmployee !== "all") {
      filtered = filtered.filter((log) => log.employeeId.toString() === filterEmployee);
    }

    setFilteredLogs(filtered);
  }, [workLogs, searchTerm, filterStatus, filterEmployee]);

  const uniqueEmployees = Array.from(
    new Map(workLogs.map((log) => [log.employeeId, log.employeeName])).entries()
  ).map(([id, name]) => ({ id, name }));

  const handleMarkAsRead = (logId: number) => {
    setWorkLogs((prevLogs) =>
      prevLogs.map((log) =>
        log.id === logId ? { ...log, status: "read" as const } : log
      )
    );
  };

  const handleMarkAsAcknowledged = (logId: number) => {
    setWorkLogs((prevLogs) =>
      prevLogs.map((log) =>
        log.id === logId ? { ...log, status: "acknowledged" as const } : log
      )
    );
  };

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    sent_to_admin: {
      label: "New",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: <Clock className="h-4 w-4" />,
    },
    read: {
      label: "Reviewed",
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: <MessageSquare className="h-4 w-4" />,
    },
    acknowledged: {
      label: "Acknowledged",
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: <CheckCircle className="h-4 w-4" />,
    },
  };

  return (
    <SidebarLayout>
      <PageHeader
        title="Employee Work Logs"
        description="View real-time updates of what employees are currently doing."
      />

      {/* Filters */}
      <Card className="mb-6 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Search
              </label>
              <Input
                placeholder="Search by employee name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Status
              </label>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <option value="all">All Status</option>
                <option value="sent_to_admin">New</option>
                <option value="read">Reviewed</option>
                <option value="acknowledged">Acknowledged</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Employee
              </label>
              <Select value={filterEmployee} onValueChange={(value) => setFilterEmployee(value)}>
                <option value="all">All Employees</option>
                {uniqueEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id.toString()}>
                    {emp.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Logs List */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="No Work Logs"
          description="No employee work descriptions match your filters."
        />
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const config = statusConfig[log.status];
            return (
              <Card key={log.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{log.employeeName}</h3>
                          <Badge className={config.color}>
                            <span className="flex items-center gap-1">
                              {config.icon}
                              {config.label}
                            </span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(log.timestamp), "PPpp")}
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                          {log.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    {log.status === "sent_to_admin" && (
                      <button
                        onClick={() => handleMarkAsRead(log.id)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Mark as Reviewed
                      </button>
                    )}
                    {log.status !== "acknowledged" && (
                      <button
                        onClick={() => handleMarkAsAcknowledged(log.id)}
                        className="px-3 py-1 text-sm bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </SidebarLayout>
  );
}
