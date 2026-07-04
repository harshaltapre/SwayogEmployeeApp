import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Common
  active: { label: "Active", className: "bg-secondary/15 text-secondary hover:bg-secondary/20" },
  inactive: { label: "Inactive", className: "bg-muted text-muted-foreground hover:bg-muted" },
  pending: { label: "Pending", className: "bg-primary/12 text-primary hover:bg-primary/18" },
  completed: { label: "Completed", className: "bg-secondary/15 text-secondary hover:bg-secondary/20" },
  
  // Complaints
  new: { label: "New", className: "bg-primary/12 text-primary hover:bg-primary/18" },
  assigned: { label: "Assigned", className: "bg-accent text-accent-foreground hover:bg-accent" },
  in_progress: { label: "In Progress", className: "bg-primary/12 text-primary hover:bg-primary/18" },
  resolved: { label: "Resolved", className: "bg-secondary/15 text-secondary hover:bg-secondary/20" },
  escalated: { label: "Escalated", className: "bg-destructive/15 text-destructive hover:bg-destructive/20" },
  
  // Invoices
  paid: { label: "Paid", className: "bg-secondary/15 text-secondary hover:bg-secondary/20" },
  overdue: { label: "Overdue", className: "bg-destructive/15 text-destructive hover:bg-destructive/20" },
  
  // AMC
  expired: { label: "Expired", className: "bg-destructive/15 text-destructive hover:bg-destructive/20" },
  expiring_soon: { label: "Expiring Soon", className: "bg-primary/12 text-primary hover:bg-primary/18" },
  none: { label: "None", className: "bg-muted text-muted-foreground hover:bg-muted" },

  // Priorities
  high: { label: "High", className: "bg-destructive/15 text-destructive hover:bg-destructive/20" },
  medium: { label: "Medium", className: "bg-primary/12 text-primary hover:bg-primary/18" },
  low: { label: "Low", className: "bg-accent text-accent-foreground hover:bg-accent" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const config = statusConfig[normalizedStatus] || { label: status, className: "bg-muted text-muted-foreground" };

  return (
    <Badge variant="outline" className={cn("border-border font-medium", config.className, className)}>
      {config.label}
    </Badge>
  );
}
