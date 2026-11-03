import { SidebarLayout } from "@/components/SidebarLayout";
import { useParams, useLocation } from "wouter";
import { EmployeeDetailContent } from "@/components/employees/EmployeeDetailContent";

export default function AdminEmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const employeeId = parseInt(id || "0");

  if (!employeeId) return <SidebarLayout>Invalid Employee ID</SidebarLayout>;

  return (
    <SidebarLayout>
      <EmployeeDetailContent 
        id={employeeId} 
        onBack={() => setLocation("/admin/employees")} 
      />
    </SidebarLayout>
  );
}
