import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, User, Clock, Camera, Star, IndianRupee } from "lucide-react";
import { useListTasks } from "@/lib/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Task {
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
  customerRating?: number;
  fixCharges?: number;
}

interface TaskCalendarProps {
  onTaskClick?: (task: Task) => void;
}

export function TaskCalendar({ onTaskClick }: TaskCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const { data: tasks } = useListTasks({});

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDate = (date: Date) => {
    return tasks?.filter(task => 
      isSameDay(new Date(task.scheduledTime), date)
    ) || [];
  };

  const getTaskStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "bg-green-100 text-green-700 border-green-200";
      case "in_progress": return "bg-blue-100 text-blue-700 border-blue-200";
      case "assigned": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const handleDateClick = (date: Date) => {
    const dayTasks = getTasksForDate(date);
    if (dayTasks.length > 0) {
      setSelectedDate(date);
      setSelectedTasks(dayTasks);
      setIsDetailModalOpen(true);
    }
  };

  const handleTaskClick = (task: Task) => {
    if (onTaskClick) {
      onTaskClick(task);
    }
    setIsDetailModalOpen(false);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Task Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold min-w-[150px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-slate-500 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(date => {
            const dayTasks = getTasksForDate(date);
            const isToday = isSameDay(date, new Date());
            const hasTasks = dayTasks.length > 0;
            
            return (
              <div
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={`
                  min-h-[80px] p-2 rounded-lg border cursor-pointer transition-all
                  ${isToday ? 'bg-primary/10 border-primary' : 'bg-white border-slate-200 hover:border-primary'}
                  ${hasTasks ? 'hover:shadow-md' : ''}
                `}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-slate-700'}`}>
                  {format(date, "d")}
                </div>
                {hasTasks && (
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map(task => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task);
                        }}
                        className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: getTaskStatusColor(task.status) }}
                      >
                        {task.jobType}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-slate-500 font-medium">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Tasks for {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedTasks.map(task => (
              <Card 
                key={task.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleTaskClick(task)}
              >
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
                          <Clock className="h-4 w-4" />
                          {format(new Date(task.scheduledTime), "h:mm a")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
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
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
