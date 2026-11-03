import { useState } from "react";
import {
  useCreateTaskAssignment,
  useGetEmployee,
  useListTasks,
  getGetEmployeeQueryKey,
  getListTasksQueryKey,
} from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Phone, Mail, MapPin, Briefcase, Star, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const assignTaskSchema = z.object({
  jobType: z.string().trim().min(2, "Job type is required"),
  description: z.string().trim().min(3, "Description is required"),
  customerName: z.string().trim().min(2, "Customer name is required"),
  customerPhone: z.string().trim().min(8, "Phone is required"),
  address: z.string().trim().min(5, "Address is required"),
  scheduledTime: z.string().min(1, "Schedule is required"),
});

type AssignTaskValues = z.infer<typeof assignTaskSchema>;

interface EmployeeDetailContentProps {
  id: number;
  onBack?: () => void;
  hideHeader?: boolean;
}

export function EmployeeDetailContent({ id: employeeId, onBack, hideHeader = false }: EmployeeDetailContentProps) {
  const { toast } = useToast();
  
  const { data: employee, isLoading } = useGetEmployee(employeeId, {
    query: { enabled: !!employeeId, queryKey: getGetEmployeeQueryKey(employeeId) }
  });

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const assignForm = useForm<AssignTaskValues>({
    resolver: zodResolver(assignTaskSchema),
    defaultValues: {
      jobType: "Service",
      description: "",
      customerName: "",
      customerPhone: "",
      address: "",
      scheduledTime: "",
    },
  });

  const employeeUserId = employee?.userId ?? String(employee?.id ?? "");
  const { data: employeeTasks } = useListTasks(
    { employeeUserId },
    {
      query: {
        enabled: !!employeeUserId,
        queryKey: getListTasksQueryKey({ employeeUserId }),
      },
    },
  );

  const assignTaskMutation = useCreateTaskAssignment({
    mutation: {
      onSuccess: () => {
        toast({ title: "Task assigned", description: "Employee can now see this task in their task page." });
        assignForm.reset();
        setIsAssignDialogOpen(false);
      },
      onError: (error: any) => {
        toast({
          title: "Task assignment failed",
          description: error?.error ?? error?.message ?? "Unable to assign task",
          variant: "destructive",
        });
      },
    },
  });

  const onAssignTask = (values: AssignTaskValues) => {
    if (!employeeUserId) return;
    assignTaskMutation.mutate({
      data: {
        employeeUserId,
        jobType: values.jobType,
        description: values.description,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        address: values.address,
        scheduledTime: new Date(values.scheduledTime).toISOString(),
      },
    });
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl"></div>;
  if (!employee) return <div>Employee not found</div>;

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <PageHeader 
          title="Employee Profile"
          action={
            <div className="flex gap-2">
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                   <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              )}
              <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Assign Task</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Assign Task to {employee?.name}</DialogTitle>
                    <DialogDescription>Add multiple tasks as needed. Employee will see these immediately.</DialogDescription>
                  </DialogHeader>
                  <Form {...assignForm}>
                    <form onSubmit={assignForm.handleSubmit(onAssignTask)} className="space-y-3">
                      <FormField control={assignForm.control} name="jobType" render={({ field }) => (
                        <FormItem><FormLabel>Task Type</FormLabel><FormControl><Input {...field} placeholder="Installation / Service / Complaint" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={assignForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="Task details" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={assignForm.control} name="customerName" render={({ field }) => (
                        <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={assignForm.control} name="customerPhone" render={({ field }) => (
                        <FormItem><FormLabel>Customer Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={assignForm.control} name="address" render={({ field }) => (
                        <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={assignForm.control} name="scheduledTime" render={({ field }) => (
                        <FormItem><FormLabel>Scheduled At</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={assignTaskMutation.isPending}>Assign Task</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          }
          breadcrumbs={[
            { label: "Employees", href: "#", onClick: onBack },
            { label: employee.name }
          ]}
        />
      )}

      {hideHeader && onBack && (
          <Button variant="ghost" className="mb-4" onClick={onBack}>
             <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
          </Button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 shadow-sm border-slate-200">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar className="h-24 w-24 mb-4 border-2 border-primary/20">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-slate-900">{employee.name}</h2>
              <p className="text-slate-500 capitalize mb-3">{employee.role.replace('_', ' ')}</p>
              <StatusBadge status={employee.status} />
            </div>

            <div className="space-y-4 text-sm text-slate-600 border-t pt-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400" /> {employee.phone}
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" /> {employee.email}
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400" /> Zone: {employee.zone}
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" /> Joined {format(new Date(employee.joiningDate), "MMM yyyy")}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-slate-50 border-0 shadow-none">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                  <Briefcase className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{employee.activeTasksCount}</p>
                <p className="text-xs text-slate-500 font-medium">Active Tasks</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-0 shadow-none">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                  <Briefcase className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{employee.jobsCompletedThisMonth}</p>
                <p className="text-xs text-slate-500 font-medium">Jobs This Month</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-0 shadow-none">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mb-2">
                  <Star className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{employee.rating}</p>
                <p className="text-xs text-slate-500 font-medium">Rating</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Task Overview</span>
                <Badge variant="outline" className="text-xs font-normal">
                  {employeeTasks?.length ?? 0} Total
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="today" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="today" className="text-xs sm:text-sm">Today</TabsTrigger>
                  <TabsTrigger value="upcoming" className="text-xs sm:text-sm">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs sm:text-sm">Completed</TabsTrigger>
                </TabsList>

                {[
                  { value: "today", tasks: employeeTasks?.filter(t => (t.scheduledTime.startsWith(format(new Date(), "yyyy-MM-dd")) || t.scheduledTime < format(new Date(), "yyyy-MM-dd")) && t.status !== "completed") ?? [] },
                  { value: "upcoming", tasks: employeeTasks?.filter(t => t.scheduledTime > format(new Date(), "yyyy-MM-dd") && t.status !== "completed" && !t.scheduledTime.startsWith(format(new Date(), "yyyy-MM-dd"))) ?? [] },
                  { value: "completed", tasks: employeeTasks?.filter(t => t.status === "completed") ?? [] }
                ].map(({ value, tasks: groupTasks }) => (
                  <TabsContent key={value} value={value} className="mt-0">
                    {groupTasks.length > 0 ? (
                      <div className="space-y-4">
                        {groupTasks.map(task => (
                          <div key={task.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{task.jobType}</span>
                                <span className="text-[10px] text-slate-400 font-mono">#{task.id}</span>
                              </div>
                              <StatusBadge status={task.status} />
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{task.description}</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 text-primary" />
                                {format(new Date(task.scheduledTime), "MMM d, yyyy")}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 text-primary" />
                                <span className="truncate">{task.address}</span>
                              </div>
                            </div>

                            {task.latitude && task.longitude && (
                              <a 
                                href={`https://www.google.com/maps?q=${task.latitude},${task.longitude}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1.5 mt-3 font-bold"
                              >
                                <MapPin className="h-3 w-3" /> View Site Location
                              </a>
                            )}
                            
                            {task.completionMessage && (
                              <div className="mt-3 p-2 bg-emerald-50 rounded border border-emerald-100">
                                <p className="text-[11px] text-emerald-800"><span className="font-bold">Result:</span> {task.completionMessage}</p>
                                {task.completionDocumentUrl && (
                                  <a href={task.completionDocumentUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline mt-1 inline-block font-bold">
                                    View Proof Document
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50/50">
                        <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-2 opacity-50" />
                        <p className="text-slate-500 font-medium">No {value} tasks</p>
                        <p className="text-[11px] text-slate-400 mt-1">This technician has no tasks in this category.</p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
