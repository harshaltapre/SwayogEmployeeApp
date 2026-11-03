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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  useListServiceRequests,
  useListAmcVisits,
} from "@/lib/api-client";
import { INDIAN_FESTIVALS_2026 } from "@/lib/festivals";
import { useQueryClient } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = "complaint" | "amc" | "festival";

type CalendarEvent = {
  id: string | number;
  title: string;
  subtitle: string;
  start: Date;
  type: EventType;
  status?: string;
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
  const [filters, setFilters] = useState({ complaints: true, amc: true, festivals: true });

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

    return all;
  }, [serviceRequests, amcVisits, filters]);

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

  const toggleFilter = (key: keyof typeof filters) =>
    setFilters((f) => ({ ...f, [key]: !f[key] }));

  return (
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
                <Icon className={cn("h-3.5 w-3.5 shrink-0", key === "complaints" ? "text-blue-500" : key === "amc" ? "text-emerald-500" : "text-amber-500")} />
                <span className="text-sm text-slate-700 font-medium">
                  {label}
                  {count > 0 && (
                    <span className={cn("ml-1.5 text-[9px] font-bold rounded-full px-1.5 py-0.5",
                      key === "complaints" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
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
  );
};
