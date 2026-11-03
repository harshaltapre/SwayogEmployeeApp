import { Badge } from "@/components/ui/badge";
import { SubAdminLayout } from "@/components/subadmin/SubAdminLayout";
import { EmployeeCalendar } from "@/components/employee/EmployeeCalendar";

export default function SubAdminCalendar() {
  return (
    <SubAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground mt-1">
              Unified view of complaints, AMC visits, and team schedules.
            </p>
          </div>
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 font-bold"
          >
            Team Overview
          </Badge>
        </div>

        {/* Calendar */}
        <EmployeeCalendar />
      </div>
    </SubAdminLayout>
  );
}
