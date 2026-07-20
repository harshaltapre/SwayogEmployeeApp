import React, { useState, useMemo } from "react";
import {
  format,
  addDays,
  startOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  isToday,
  parseISO,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar as CalendarIcon,
  PartyPopper,
  RefreshCw,
  Wrench,
  ShieldCheck,
  Clock,
  Camera,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  useListServiceRequests,
  useListAmcVisits,
  useMarkVisitDone,
  useUpdateAmcVisit,
  useListTasks,
} from "@/lib/api-client";
import { INDIAN_FESTIVALS_2026 } from "@/lib/festivals";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = "complaint" | "amc" | "festival" | "task";

type CalendarEvent = {
  id: string | number;
  title: string;
  subtitle: string;
  start: Date;
  type: EventType;
  status?: string;
  raw?: any;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDateTimeToDate(date: string, time?: string | null): Date {
  if (!date) return new Date();
  
  // 1. If it's already an ISO string or contains time info, parse it
  if (date.includes("T")) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      // If we have a separate time override, apply it
      if (time && /^\d{2}:\d{2}/.test(time)) {
        const [h, m] = time.split(":").map(Number);
        d.setHours(h, m, 0, 0);
      }
      return d;
    }
  }

  // 2. Handle YYYY-MM-DD + optional time
  if (time && /^\d{2}:\d{2}/.test(time)) {
    // Ensure we only take the date part
    const datePart = date.substring(0, 10);
    return new Date(`${datePart}T${time}:00`);
  }
  
  // 3. Fallback for simple date strings
  const cleanDate = date.substring(0, 10);
  const [y, m, d] = cleanDate.split("-").map(Number);
  if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
    return new Date(y, m - 1, d, 9, 0, 0);
  }

  // 4. Ultimate fallback
  const final = new Date(date);
  return isNaN(final.getTime()) ? new Date() : final;
}


// ─── Mini Calendar Sidebar ─────────────────────────────────────────────────

const MiniCalendar = ({
  currentMonth,
  onDayClick,
}: {
  currentMonth: Date;
  onDayClick?: (d: Date) => void;
}) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = addDays(startOfWeek(addDays(monthEnd, 7)), -1);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="text-[11px]">
      <div className="grid grid-cols-7 mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center font-bold text-slate-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, i) => (
          <div
            key={i}
            onClick={() => onDayClick?.(day)}
            className={cn(
              "h-6 w-6 flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-blue-100 hover:text-blue-700",
              day.getMonth() !== monthStart.getMonth() ? "text-slate-300" : "text-slate-700",
              isToday(day) && "bg-blue-600 text-white font-bold hover:bg-blue-700 hover:text-white"
            )}
          >
            {format(day, "d")}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Event Styles ─────────────────────────────────────────────────────────────

const STYLE: Record<EventType, { card: string; text: string; icon: any }> = {
  complaint: {
    card: "bg-blue-50 border-l-[3px] border-blue-500 hover:bg-blue-100",
    text: "text-blue-700",
    icon: Wrench,
  },
  amc: {
    card: "bg-emerald-50 border-l-[3px] border-emerald-500 hover:bg-emerald-100",
    text: "text-emerald-700",
    icon: ShieldCheck,
  },
  festival: {
    card: "bg-amber-50 border-l-[3px] border-amber-400",
    text: "text-amber-700",
    icon: PartyPopper,
  },
  task: {
    card: "bg-purple-50 border-l-[3px] border-purple-500 hover:bg-purple-100",
    text: "text-purple-700",
    icon: Wrench,
  },
};

// ─── Main Calendar Component ──────────────────────────────────────────────────

export const EmployeeCalendar = ({
  employeeId,
}: {
  employeeId?: string | number;
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ complaints: true, amc: true, festivals: true, tasks: true });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // ─── Data: Complaints ─────────────────────────────────────────────────────
  const {
    data: serviceRequestsData,
    isFetching: complaintsLoading,
    error: complaintsError,
  } = useListServiceRequests();
  const serviceRequests = serviceRequestsData ?? [];

  // ─── Data: AMC Visits ─────────────────────────────────────────────────────
  const { data: amcVisitsData } = useListAmcVisits({
    from: format(subWeeks(currentDate, 8), "yyyy-MM-dd"),
    to: format(addWeeks(currentDate, 8), "yyyy-MM-dd"),
  });
  const amcVisits = amcVisitsData ?? [];

  // ─── Data: Tasks ──────────────────────────────────────────────────────────
  const { data: tasksData, isFetching: tasksLoading } = useListTasks();
  const tasks = tasksData ?? [];


  // ─── Build Events ─────────────────────────────────────────────────────────
  const events = useMemo<CalendarEvent[]>(() => {
    const all: CalendarEvent[] = [];

    // 1. Scheduled complaints only
    if (filters.complaints) {
      serviceRequests
        .filter((c) => {
          const d = c.scheduledDate || c.scheduled_date;
          return !!d;
        })
        .forEach((c) => {
          const dateStr = (c.scheduledDate || c.scheduled_date)!;
          const start = parseDateTimeToDate(dateStr, c.scheduledTime);
          all.push({
            id: `c-${c.id}`,
            title: c.title || "Complaint",
            subtitle: c.customerName,
            start,
            type: "complaint",
            status: c.status,
            raw: c,
          });
        });
    }

    // 2. AMC Visits
    if (filters.amc) {
      amcVisits.forEach((v: any) => {
        try {
          const start = parseDateTimeToDate(
            v.scheduledDate,
            v.scheduledTime ?? null
          );
          all.push({
            id: `amc-${v.id}`,
            title: "AMC Visit",
            subtitle: v.customer?.fullName ?? "Client",
            start,
            type: "amc",
            status: v.status,
            raw: v,
          });
        } catch {
          // skip bad dates
        }
      });
    }

    // 3. Festivals
    if (filters.festivals) {
      INDIAN_FESTIVALS_2026.forEach((f) => {
        const start = parseISO(f.date);
        all.push({ id: f.id, title: f.name, subtitle: "", start, type: "festival" });
      });
    }

    // 4. Tasks
    if (filters.tasks) {
      tasks.forEach((t: any) => {
        try {
          const start = parseDateTimeToDate(t.scheduledTime);
          all.push({
            id: `task-${t.id}`,
            title: t.jobType || "Task Assignment",
            subtitle: t.customerName ?? "Client",
            start,
            type: "task",
            status: t.status,
            raw: t,
          });
        } catch {
          // skip bad dates
        }
      });
    }

    return all;
  }, [serviceRequests, amcVisits, tasks, filters]);

  // Search filter
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      (e) => e.title.toLowerCase().includes(q) || e.subtitle.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  // Week grid
  const weekStart = startOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  const forDay = (day: Date) => filtered.filter((e) => isSameDay(e.start, day));
  const festsForDay = (day: Date) => forDay(day).filter((e) => e.type === "festival");
  const timedForDay = (day: Date) => forDay(day).filter((e) => e.type !== "festival");

  const complaintCount = filtered.filter((e) => e.type === "complaint").length;
  const amcCount = filtered.filter((e) => e.type === "amc").length;
  const taskCount = filtered.filter((e) => e.type === "task").length;

  const toggleFilter = (key: keyof typeof filters) =>
    setFilters((f) => ({ ...f, [key]: !f[key] }));

  return (
    <>
      <Card className="border border-slate-100 shadow-2xl overflow-hidden bg-white rounded-2xl">
      <div className="flex h-[820px]">
        {/* ── Sidebar ── */}
        <aside className="w-60 border-r border-slate-100 flex flex-col gap-5 bg-slate-50/40 p-4 shrink-0">
          {/* Mini calendar nav */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {format(currentDate, "MMM yyyy")}
              </span>
              <div className="flex gap-0.5">
                <button onClick={() => setCurrentDate((d) => subWeeks(d, 4))} className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center text-slate-400">
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button onClick={() => setCurrentDate((d) => addWeeks(d, 4))} className="h-5 w-5 rounded hover:bg-slate-200 flex items-center justify-center text-slate-400">
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
            <MiniCalendar currentMonth={currentDate} onDayClick={(d) => setCurrentDate(d)} />
          </div>

          <hr className="border-slate-100" />

          {/* Filter toggles */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calendars</span>

            {[
              { key: "complaints" as const, label: "Complaints", icon: Wrench, color: "border-blue-500 bg-blue-500", count: complaintCount },
              { key: "amc" as const, label: "AMC Visits", icon: ShieldCheck, color: "border-emerald-500 bg-emerald-500", count: amcCount },
              { key: "tasks" as const, label: "Tasks", icon: Wrench, color: "border-purple-500 bg-purple-500", count: taskCount },
              { key: "festivals" as const, label: "Holidays", icon: PartyPopper, color: "border-amber-400 bg-amber-400", count: 0 },
            ].map(({ key, label, icon: Icon, color, count }) => (
              <div
                key={key}
                className="flex items-center gap-2.5 cursor-pointer group"
                onClick={() => toggleFilter(key)}
              >
                <div className={cn(
                  "h-4 w-4 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                  color.split(" ")[0],
                  filters[key] ? color.split(" ")[1] : "bg-white"
                )}>
                  {filters[key] && (
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" fill="none" /></svg>
                  )}
                </div>
                <Icon className={cn("h-3.5 w-3.5 shrink-0", key === "complaints" ? "text-blue-500" : key === "amc" ? "text-emerald-500" : key === "tasks" ? "text-purple-500" : "text-amber-500")} />
                <span className="text-sm text-slate-700 font-medium">
                  {label}
                  {count > 0 && (
                    <span className={cn("ml-1.5 text-[9px] font-bold rounded-full px-1.5 py-0.5",
                      key === "complaints" ? "bg-blue-100 text-blue-700" : key === "amc" ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"
                    )}>{count}</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <hr className="border-slate-100" />

          {/* Debug / sync status */}
          <div className="space-y-1 px-1">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
              <div className={cn("h-1.5 w-1.5 rounded-full", complaintsLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400")} />
              {complaintsLoading ? "Syncing…" : `${serviceRequests.length} complaints loaded`}
            </div>
            {complaintsError && (
              <div className="text-[10px] text-red-500 font-medium">
                ⚠ Failed to load complaints
              </div>
            )}
            <div className="text-[10px] text-slate-400">
              Scheduled: <span className="font-bold text-blue-600">{complaintCount}</span>
            </div>
          </div>
        </aside>

        {/* ── Main Grid ── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="h-14 border-b border-slate-100 flex items-center justify-between px-5 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="h-8 rounded-full text-xs font-bold border-slate-200">
                Today
              </Button>
              <div className="flex gap-0.5">
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate((d) => subWeeks(d, 1))} className="h-7 w-7 text-slate-400"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate((d) => addWeeks(d, 1))} className="h-7 w-7 text-slate-400"><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <h2 className="text-base font-bold text-slate-800">
                {format(weekStart, "d MMM")} – {format(addDays(weekStart, 6), "d MMM, yyyy")}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1.5 bg-slate-100 rounded-full text-xs outline-none w-36 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["service-requests"] })}
                className="h-7 w-7 text-slate-400 hover:text-blue-600"
                title="Refresh"
              >
                <RefreshCw className={cn("h-4 w-4", complaintsLoading && "animate-spin")} />
              </Button>
            </div>
          </header>

          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-slate-100 bg-white shrink-0">
            <div className="h-16 border-r border-slate-100 flex items-end justify-center pb-2">
              <span className="text-[9px] text-slate-300 font-bold uppercase">GMT+5:30</span>
            </div>
            {weekDays.map((day, i) => {
              const count = timedForDay(day).length;
              return (
                <div key={i} className={cn("flex flex-col items-center justify-center py-2 border-r border-slate-100 last:border-r-0", isToday(day) && "bg-blue-50/50")}>
                  <span className={cn("text-[10px] font-bold mb-1", isToday(day) ? "text-blue-600" : "text-slate-400")}>
                    {format(day, "EEE").toUpperCase()}
                  </span>
                  <div className={cn("h-9 w-9 flex items-center justify-center rounded-full text-lg font-bold", isToday(day) ? "bg-blue-600 text-white shadow shadow-blue-200" : "text-slate-700")}>
                    {format(day, "d")}
                  </div>
                  {count > 0 && (
                    <div className="mt-1 flex gap-0.5 flex-wrap justify-center">
                      {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                        <div key={j} className="h-1 w-1 rounded-full bg-blue-500" />
                      ))}
                      {count > 3 && <span className="text-[8px] text-blue-500 font-bold">+{count - 3}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Scrollable grid */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="grid grid-cols-8">
              {/* Time column */}
              <div className="flex flex-col border-r border-slate-100">
                {timeSlots.map((hour) => (
                  <div key={hour} className="h-16 relative border-b border-slate-50 pr-2 text-right shrink-0">
                    <span className="absolute -top-2 right-2 text-[9px] text-slate-300 font-medium">
                      {hour === 0 ? "" : hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map((day, di) => {
                const fests = festsForDay(day);
                const timed = timedForDay(day);
                return (
                  <div key={di} className={cn("relative border-r border-slate-100 last:border-r-0", isToday(day) && "bg-blue-50/10")}>
                    {/* Grid lines */}
                    {timeSlots.map((hour) => (
                      <div key={hour} className="h-16 border-b border-slate-50 hover:bg-slate-50/60 transition-colors" />
                    ))}

                    {/* Festival banners (top) */}
                    <div className="absolute top-1 left-0.5 right-0.5 z-20 flex flex-col gap-0.5">
                      {fests.map((e) => (
                        <div key={e.id} className="bg-amber-100 border-l-2 border-amber-400 rounded px-1.5 py-0.5 flex items-center gap-1">
                          <PartyPopper className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                          <span className="text-[9px] font-bold text-amber-700 truncate">{e.title}</span>
                        </div>
                      ))}
                    </div>

                    {/* Timed events */}
                    {timed.map((e, idx) => {
                      const hour = e.start.getHours();
                      const min = e.start.getMinutes();
                      const top = hour * 64 + (min / 60) * 64 + (fests.length > 0 ? 22 : 2);
                      const s = STYLE[e.type];
                      const Icon = s.icon;
                      const colCount = timed.length;
                      const colWidth = colCount > 1 ? 50 : 100;
                      const colLeft = colCount > 1 ? (idx % 2) * 50 : 0;
                      return (
                        <div
                          key={e.id}
                          className={cn("absolute z-10 rounded-md p-1.5 shadow-sm cursor-pointer transition-all", s.card)}
                          style={{
                            top: `${top}px`,
                            left: `${colLeft}%`,
                            width: `${colWidth}%`,
                            minHeight: "52px",
                          }}
                          title={`${e.title} — ${e.subtitle}`}
                          onClick={() => setSelectedEvent(e)}
                        >
                          <div className={cn("text-[10px] font-black uppercase truncate tracking-tight flex items-center gap-1", s.text)}>
                            <Icon className="h-2.5 w-2.5 shrink-0" />
                            {e.title}
                          </div>
                          <div className="text-[9px] text-slate-500 truncate">{e.subtitle}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="h-2 w-2 text-slate-400" />
                            <span className="text-[9px] text-slate-400">{format(e.start, "h:mm a")}</span>
                            {e.status && (
                              <span className={cn("ml-auto text-[8px] font-bold rounded px-1",
                                e.status === "completed" ? "bg-green-100 text-green-700" :
                                e.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                                "bg-amber-100 text-amber-700"
                              )}>
                                {e.status}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </Card>

    {/* Selected Event Detail Modal */}
    <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800 text-lg font-bold">
            {selectedEvent?.type === "amc" ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : selectedEvent?.type === "complaint" ? (
              <Wrench className="h-5 w-5 text-blue-600 shrink-0" />
            ) : selectedEvent?.type === "task" ? (
              <Wrench className="h-5 w-5 text-purple-600 shrink-0" />
            ) : (
              <PartyPopper className="h-5 w-5 text-amber-500 shrink-0" />
            )}
            {selectedEvent?.title} Details
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Unified calendar event details and maintenance records.
          </DialogDescription>
        </DialogHeader>
        
        {selectedEvent && (
          <div className="space-y-4 py-2 text-sm text-slate-700">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Status</span>
              <Badge 
                variant="outline"
                className={cn(
                  "capitalize font-bold text-xs px-2.5 py-0.5",
                  selectedEvent.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                  selectedEvent.status === "scheduled" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  "bg-amber-50 text-amber-700 border-amber-200"
                )}
              >
                {selectedEvent.status || "Scheduled"}
              </Badge>
            </div>

            {/* Customer Info */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Customer Details</span>
              <div className="flex justify-between">
                <span className="text-slate-500">Name</span>
                <span className="font-semibold text-slate-800">{selectedEvent.subtitle}</span>
              </div>
              {selectedEvent.type === "amc" && selectedEvent.raw?.customer && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-medium text-slate-700">{selectedEvent.raw.customer.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">City</span>
                    <span className="font-medium text-slate-700">{selectedEvent.raw.customer.city}</span>
                  </div>
                </>
              )}
            </div>

            {/* AMC Visit specific details */}
            {selectedEvent.type === "amc" && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">AMC Visit Details</span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date</span>
                    <span className="font-semibold text-slate-800">{format(selectedEvent.start, "dd MMM yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduled Time</span>
                    <span className="font-semibold text-slate-800">{selectedEvent.raw?.timeSlot || "10:00 AM"}</span>
                  </div>
                  {selectedEvent.raw?.cleaningNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cleaning Number</span>
                      <span className="font-medium text-slate-700">Visit #{selectedEvent.raw.cleaningNumber}</span>
                    </div>
                  )}
                  {selectedEvent.raw?.assignedEmployee?.name && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Allotted Person</span>
                      <span className="font-bold text-slate-850">{selectedEvent.raw.assignedEmployee.name}</span>
                    </div>
                  )}
                </div>

                {/* If completed, show complete details + photos */}
                {selectedEvent.status === "completed" ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Completion Details</span>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Completed By</span>
                        <span className="font-bold text-slate-850">{selectedEvent.raw?.completedByName || "Technician"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Completed At</span>
                        <span className="font-medium text-slate-700">
                          {selectedEvent.raw?.completedAt ? format(new Date(selectedEvent.raw.completedAt), "dd MMM yyyy, hh:mm a") : "—"}
                        </span>
                      </div>
                      {selectedEvent.raw?.visitNotes && (
                        <div className="border-t border-slate-200/60 pt-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Visit Notes</span>
                          <p className="text-xs text-slate-700 italic font-medium">"{selectedEvent.raw.visitNotes}"</p>
                        </div>
                      )}
                    </div>

                    {/* Before and After Images */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 block">Clean & Telemetry Proof Photos</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex flex-col items-center w-full">
                          <span className="text-[10px] font-bold text-slate-500 p-1.5 uppercase bg-white w-full text-center border-b">Before Clean</span>
                          {selectedEvent.raw?.beforeImageUrl ? (
                            <CompletedVisitPhotoDisplay 
                              visit={selectedEvent.raw}
                              type="before"
                              imageUrl={selectedEvent.raw.beforeImageUrl}
                              onPreview={(url) => setPreviewImageUrl(url)}
                              onSuccess={(updatedVisit) => {
                                setSelectedEvent(prev => prev ? {
                                  ...prev,
                                  raw: {
                                    ...prev.raw,
                                    ...updatedVisit
                                  }
                                } : null);
                              }}
                            />
                          ) : (
                            <CompletedVisitPhotoUpload 
                              visit={selectedEvent.raw} 
                              type="before" 
                              onSuccess={(updatedVisit) => {
                                setSelectedEvent(prev => prev ? {
                                  ...prev,
                                  raw: {
                                    ...prev.raw,
                                    ...updatedVisit
                                  }
                                } : null);
                              }}
                            />
                          )}
                        </div>
                        <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex flex-col items-center w-full">
                          <span className="text-[10px] font-bold text-slate-500 p-1.5 uppercase bg-white w-full text-center border-b">After Clean</span>
                          {selectedEvent.raw?.afterImageUrl ? (
                            <CompletedVisitPhotoDisplay 
                              visit={selectedEvent.raw}
                              type="after"
                              imageUrl={selectedEvent.raw.afterImageUrl}
                              onPreview={(url) => setPreviewImageUrl(url)}
                              onSuccess={(updatedVisit) => {
                                setSelectedEvent(prev => prev ? {
                                  ...prev,
                                  raw: {
                                    ...prev.raw,
                                    ...updatedVisit
                                  }
                                } : null);
                              }}
                            />
                          ) : (
                            <CompletedVisitPhotoUpload 
                              visit={selectedEvent.raw} 
                              type="after" 
                              onSuccess={(updatedVisit) => {
                                setSelectedEvent(prev => prev ? {
                                  ...prev,
                                  raw: {
                                    ...prev.raw,
                                    ...updatedVisit
                                  }
                                } : null);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* If pending, technician can fill completion form */
                  <AmcCompleteForm visit={selectedEvent.raw} onSuccess={() => { setSelectedEvent(null); queryClient.invalidateQueries({ queryKey: ["amc-visits"] }); }} />
                )}
              </div>
            )}

            {/* Complaint specific details */}
            {selectedEvent.type === "complaint" && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Complaint Details</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Complaint Title</span>
                  <span className="font-semibold text-slate-800">{selectedEvent.title}</span>
                </div>
                <div className="flex flex-col border-t border-slate-200/50 pt-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</span>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white border p-2 rounded-lg">{selectedEvent.raw?.description || "No description provided."}</p>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Scheduled Time</span>
                  <span className="font-semibold text-slate-850">
                    {selectedEvent.raw?.scheduledTime ? format(new Date(selectedEvent.raw.scheduledTime), "dd MMM yyyy, hh:mm a") : "N/A"}
                  </span>
                </div>
              </div>
            )}

            {/* Task specific details */}
            {selectedEvent.type === "task" && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Task Details</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Job Type</span>
                  <span className="font-semibold text-slate-800">{selectedEvent.title}</span>
                </div>
                <div className="flex flex-col border-t border-slate-200/50 pt-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</span>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white border p-2 rounded-lg">{selectedEvent.raw?.description || "No description provided."}</p>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Customer</span>
                  <span className="font-semibold text-slate-800">{selectedEvent.raw?.customerName} ({selectedEvent.raw?.customerPhone})</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Address</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={selectedEvent.raw?.address}>{selectedEvent.raw?.address}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Scheduled Time</span>
                  <span className="font-semibold text-slate-800">
                    {selectedEvent.raw?.scheduledTime ? format(new Date(selectedEvent.raw.scheduledTime), "dd MMM yyyy, hh:mm a") : "N/A"}
                  </span>
                </div>
                {selectedEvent.raw?.status === "completed" && (
                  <div className="flex flex-col border-t border-slate-200/50 pt-2 mt-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase block mb-1">Completion Details</span>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Completed By</span>
                      <span className="font-semibold text-slate-800">
                        {selectedEvent.raw?.assignedEmployees?.find((e: any) => e.status === "completed")?.name || selectedEvent.raw?.assignedEmployees?.[0]?.name || "Employee"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Completed At</span>
                      <span className="font-semibold text-slate-800">
                        {selectedEvent.raw?.completedAt ? format(new Date(selectedEvent.raw.completedAt), "dd MMM yyyy, hh:mm a") : "N/A"}
                      </span>
                    </div>
                    {selectedEvent.raw?.completionMessage && (
                       <div className="mt-1.5 text-xs text-slate-700 leading-relaxed bg-white border p-2 rounded-lg italic">
                         Remarks: {selectedEvent.raw.completionMessage}
                       </div>
                    )}
                  </div>
                )}
                {selectedEvent.raw?.taskRate !== undefined && selectedEvent.raw?.taskRate !== null && (
                  <div className="flex justify-between mt-1 border-t border-slate-200/50 pt-2 text-indigo-700 font-bold text-sm">
                    <span>Task Rate / Cost</span>
                    <span>₹{selectedEvent.raw.taskRate.toLocaleString()}</span>
                  </div>
                )}
                
                {/* Images section */}
                {(selectedEvent.raw?.beforeImageUrl || selectedEvent.raw?.afterImageUrl) && (
                  <div className="border-t border-slate-200/50 pt-2.5 mt-1 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Before & After Proofs</span>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedEvent.raw?.beforeImageUrl && (
                        <div className="bg-white border rounded-lg p-1.5 flex flex-col items-center">
                          <span className="text-[9px] font-bold text-slate-500 uppercase mb-1">Before Work</span>
                          <img 
                            src={selectedEvent.raw.beforeImageUrl} 
                            alt="Before" 
                            className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90 border border-slate-100"
                            onClick={() => setPreviewImageUrl(selectedEvent.raw.beforeImageUrl)}
                          />
                          {(selectedEvent.raw?.beforeLatitude || selectedEvent.raw?.beforeLongitude) && (
                            <span className="text-[8px] text-slate-450 mt-1 truncate w-full text-center">
                              📍 {selectedEvent.raw.beforeLatitude?.toFixed(4)}, {selectedEvent.raw.beforeLongitude?.toFixed(4)}
                            </span>
                          )}
                        </div>
                      )}
                      {selectedEvent.raw?.afterImageUrl && (
                        <div className="bg-white border rounded-lg p-1.5 flex flex-col items-center">
                          <span className="text-[9px] font-bold text-slate-500 uppercase mb-1">After Work</span>
                          <img 
                            src={selectedEvent.raw.afterImageUrl} 
                            alt="After" 
                            className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90 border border-slate-100"
                            onClick={() => setPreviewImageUrl(selectedEvent.raw.afterImageUrl)}
                          />
                          {(selectedEvent.raw?.afterLatitude || selectedEvent.raw?.afterLongitude) && (
                            <span className="text-[8px] text-slate-450 mt-1 truncate w-full text-center">
                              📍 {selectedEvent.raw.afterLatitude?.toFixed(4)}, {selectedEvent.raw.afterLongitude?.toFixed(4)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rating section */}
                {selectedEvent.raw?.customerRating && (
                  <div className="border-t border-slate-200/50 pt-2 mt-1 space-y-1.5 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Customer Review</span>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Rating</span>
                      <span className="font-bold text-amber-500 text-sm">★ {selectedEvent.raw.customerRating} / 5</span>
                    </div>
                    {selectedEvent.raw?.customerFeedback && (
                      <div className="text-xs text-slate-650 italic bg-white p-1.5 rounded border border-slate-100 leading-normal">
                        "{selectedEvent.raw.customerFeedback}"
                      </div>
                    )}
                    {selectedEvent.raw?.fixCharges !== undefined && selectedEvent.raw?.fixCharges !== null && (
                      <div className="flex justify-between text-xs font-semibold text-emerald-800 pt-1 border-t border-emerald-100">
                        <span>Fix Charges Paid</span>
                        <span>₹{selectedEvent.raw.fixCharges.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => setSelectedEvent(null)} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Photo Preview Lightbox */}
    <Dialog open={!!previewImageUrl} onOpenChange={(open) => { if (!open) setPreviewImageUrl(null); }}>
      <DialogContent className="max-w-3xl border-none bg-slate-950/95 text-white backdrop-blur-md p-0 overflow-hidden shadow-2xl flex flex-col items-center justify-center">
        <DialogHeader className="sr-only">
          <DialogTitle>Photo Preview</DialogTitle>
          <DialogDescription>Full-size preview of the uploaded AMC service photo</DialogDescription>
        </DialogHeader>
        
        <div className="relative w-full max-h-[75vh] flex items-center justify-center p-4">
          {previewImageUrl && (
            <img 
              src={previewImageUrl} 
              alt="AMC Visit Preview" 
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg border border-white/10"
            />
          )}
        </div>
        
        <div className="w-full bg-slate-900/80 px-6 py-4 flex items-center justify-between border-t border-white/10">
          <span className="text-xs text-slate-400 font-medium font-sans">
            AMC Visit Completion Photo
          </span>
          <Button 
            variant="outline" 
            onClick={() => setPreviewImageUrl(null)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white transition-colors h-8 text-xs font-semibold px-4 rounded-lg"
          >
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

function CompletedVisitPhotoUpload({
  visit,
  type,
  onSuccess,
}: {
  visit: any;
  type: "before" | "after";
  onSuccess: (updatedVisit: any) => void;
}) {
  const updateMutation = useUpdateAmcVisit();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsUploading(true);

    try {
      const b64 = await fileToBase64(file);
      const updateData: any = { id: visit.id };
      if (type === "before") {
        updateData.beforeImageUrl = b64;
      } else {
        updateData.afterImageUrl = b64;
      }

      const res = (await updateMutation.mutateAsync(updateData)) as any;
      toast({
        title: "Photo Uploaded",
        description: `Successfully uploaded ${type} photo.`,
      });
      onSuccess(res?.data || res);
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: err instanceof Error ? err.message : "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const inputId = `upload-completed-${type}-${visit.id}`;

  return (
    <div className="h-32 w-full flex flex-col items-center justify-center p-2 bg-white">
      <Label 
        htmlFor={inputId} 
        className={cn(
          "flex flex-col items-center justify-center border border-dashed border-slate-300 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors w-full h-full text-center gap-1.5",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        <Camera className="h-5 w-5 text-slate-400" />
        <span className="text-[10px] font-semibold text-slate-650 truncate max-w-full px-1">
          {isUploading ? "Uploading..." : fileName || "Camera / Upload"}
        </span>
      </Label>
      <input 
        type="file" 
        accept="image/*" 
        id={inputId} 
        className="hidden" 
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
}

function CompletedVisitPhotoDisplay({
  visit,
  type,
  imageUrl,
  onPreview,
  onSuccess,
}: {
  visit: any;
  type: "before" | "after";
  imageUrl: string;
  onPreview: (url: string) => void;
  onSuccess: (updatedVisit: any) => void;
}) {
  const updateMutation = useUpdateAmcVisit();
  const { toast } = useToast();
  const [isReplacing, setIsReplacing] = useState(false);
  
  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsReplacing(true);
    try {
      const b64 = await fileToBase64(file);
      const updateData: any = { id: visit.id };
      if (type === "before") {
        updateData.beforeImageUrl = b64;
      } else {
        updateData.afterImageUrl = b64;
      }
      
      const res = (await updateMutation.mutateAsync(updateData)) as any;
      toast({
        title: "Photo Updated",
        description: `Successfully replaced ${type} photo.`,
      });
      onSuccess(res?.data || res);
    } catch (err) {
      toast({
        title: "Replacement Failed",
        description: err instanceof Error ? err.message : "Failed to replace photo",
        variant: "destructive",
      });
    } finally {
      setIsReplacing(false);
    }
  };
  
  const inputId = `replace-${type}-${visit.id}`;
  
  return (
    <div className="relative h-32 w-full group overflow-hidden bg-slate-900 flex items-center justify-center">
      <img src={imageUrl} alt={`${type} clean proof`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      
      {/* Action Overlay */}
      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
        {/* Preview Button */}
        <Button 
          type="button" 
          size="icon" 
          variant="ghost" 
          onClick={() => onPreview(imageUrl)}
          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-md transition-transform duration-200 hover:scale-110"
          title="Preview Image"
        >
          <Eye className="h-4 w-4 text-white" />
        </Button>
        
        {/* Replace Button */}
        <Label 
          htmlFor={inputId}
          className={cn(
            "h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-md transition-transform duration-200 hover:scale-110 flex items-center justify-center cursor-pointer",
            isReplacing && "pointer-events-none opacity-50"
          )}
          title="Replace Image"
        >
          {isReplacing ? (
            <RefreshCw className="h-4 w-4 text-white animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 text-white" />
          )}
        </Label>
        <input 
          type="file" 
          accept="image/*" 
          id={inputId} 
          className="hidden" 
          onChange={handleReplaceFile}
          disabled={isReplacing}
        />
      </div>
    </div>
  );
}

function AmcCompleteForm({ visit, onSuccess }: { visit: any; onSuccess: () => void }) {
  const { toast } = useToast();
  const markDoneMutation = useMarkVisitDone();
  const [notes, setNotes] = useState("");
  const [beforeImg, setBeforeImg] = useState("");
  const [beforeFileName, setBeforeFileName] = useState("");
  const [afterImg, setAfterImg] = useState("");
  const [afterFileName, setAfterFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    markDoneMutation.mutate({
      id: visit.id,
      notes: notes.trim() || undefined,
      beforeImageUrl: beforeImg || undefined,
      afterImageUrl: afterImg || undefined,
    }, {
      onSuccess: () => {
        toast({
          title: "Visit Logged Successfully",
          description: "AMC visit status changed to completed.",
        });
        setIsSubmitting(false);
        onSuccess();
      },
      onError: (err) => {
        toast({
          title: "Failed to Complete Visit",
          description: err instanceof Error ? err.message : "Completion submit failed",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200/60 pt-4 mt-2 space-y-4">
      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">Log Visit Completion</span>
      
      {/* Upload Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-slate-400 uppercase">Before Photo</Label>
          <Label 
            htmlFor="before-image-file" 
            className="flex flex-col items-center justify-center border border-dashed border-slate-350 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors h-24 text-center gap-1.5"
          >
            <Camera className="h-5 w-5 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-650 truncate max-w-full px-1">
              {beforeFileName || "Camera / Upload"}
            </span>
          </Label>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            id="before-image-file" 
            className="hidden" 
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                setBeforeFileName(file.name);
                const b64 = await fileToBase64(file);
                setBeforeImg(b64);
              }
            }}
          />
          {beforeImg && (
            <div className="mt-1 rounded-lg border overflow-hidden relative group">
              <img src={beforeImg} alt="Preview Before" className="h-16 w-full object-cover" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-slate-400 uppercase">After Photo</Label>
          <Label 
            htmlFor="after-image-file" 
            className="flex flex-col items-center justify-center border border-dashed border-slate-350 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors h-24 text-center gap-1.5"
          >
            <Camera className="h-5 w-5 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-650 truncate max-w-full px-1">
              {afterFileName || "Camera / Upload"}
            </span>
          </Label>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            id="after-image-file" 
            className="hidden" 
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                setAfterFileName(file.name);
                const b64 = await fileToBase64(file);
                setAfterImg(b64);
              }
            }}
          />
          {afterImg && (
            <div className="mt-1 rounded-lg border overflow-hidden relative group">
              <img src={afterImg} alt="Preview After" className="h-16 w-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Completion Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="visit-notes" className="text-xs font-bold text-slate-700">Visit Notes / Remarks</Label>
        <Textarea 
          id="visit-notes" 
          placeholder="E.g., panels cleaned, telemetry checked..." 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[70px] text-xs border-slate-200 focus-visible:ring-emerald-500"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs"
        disabled={isSubmitting || markDoneMutation.isPending}
      >
        {isSubmitting ? "Saving Visit..." : "Submit & Mark Done"}
      </Button>
    </form>
  );
}
