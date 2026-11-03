import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";

interface SLATimerProps {
  deadline: string;
  resolvedAt?: string | null;
  className?: string;
}

export function SLATimer({ deadline, resolvedAt, className }: SLATimerProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (resolvedAt) return; // Stop updating if resolved
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, [resolvedAt]);

  const deadlineDate = parseISO(deadline);
  
  if (resolvedAt) {
    const resolvedDate = parseISO(resolvedAt);
    const met = resolvedDate <= deadlineDate;
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", 
        met ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700", className)}>
        <Clock className="h-3 w-3" />
        {met ? "SLA Met" : "SLA Breached"}
      </div>
    );
  }

  const isBreached = isPast(deadlineDate);
  const timeText = formatDistanceToNow(deadlineDate, { addSuffix: true });
  
  // Calculate remaining percentage (assuming 48h total for logic coloring, very rough)
  const timeDiff = deadlineDate.getTime() - now.getTime();
  const hoursLeft = timeDiff / (1000 * 60 * 60);

  let colorClass = "bg-green-100 text-green-700";
  if (isBreached) {
    colorClass = "bg-red-100 text-red-700";
  } else if (hoursLeft < 4) {
    colorClass = "bg-red-50 text-red-600 border border-red-200 animate-pulse";
  } else if (hoursLeft < 12) {
    colorClass = "bg-orange-100 text-orange-700";
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", colorClass, className)}>
      <Clock className="h-3 w-3" />
      {isBreached ? `Breached ${timeText}` : timeText}
    </div>
  );
}
