import { SidebarLayout } from "@/components/SidebarLayout";
import { useLocation, useParams } from "wouter";
import { CustomerDetailContent } from "@/components/customers/CustomerDetailContent";

export default function AdminCustomerDetail() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const parsedCustomerId = Number(id);
  const customerId = Number.isNaN(parsedCustomerId) ? null : parsedCustomerId;

  if (!customerId) return <SidebarLayout>Customer not found</SidebarLayout>;

  return (
    <SidebarLayout>
      <CustomerDetailContent 
        id={customerId} 
        onBack={() => setLocation("/admin/customers")} 
      />
    </SidebarLayout>
  );
}
