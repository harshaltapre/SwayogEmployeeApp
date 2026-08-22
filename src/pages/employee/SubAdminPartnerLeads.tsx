import React from "react";
import { SubAdminLayout } from "@/components/subadmin/SubAdminLayout";
import { PartnersLeadSection } from "@/pages/service-executive/PartnersLeadSection";

export default function SubAdminPartnerLeads() {
  return (
    <SubAdminLayout>
      <div className="space-y-6">
        <PartnersLeadSection isServiceCoordinator={true} />
      </div>
    </SubAdminLayout>
  );
}
