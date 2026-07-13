import React from "react";
import { SubAdminLayout } from "@/components/subadmin/SubAdminLayout";
import CustomersTab from "@/pages/superadmin/CustomersTab";

export default function SubAdminCustomers() {
  return (
    <SubAdminLayout>
      <div className="space-y-6">
        <CustomersTab />
      </div>
    </SubAdminLayout>
  );
}
