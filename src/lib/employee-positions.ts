/**
 * Employee Position Options
 * Used throughout the admin section for employee management
 */

export const EMPLOYEE_POSITIONS = [
  { value: "solar_design_engineer", label: "Solar Design Engineer" },
  { value: "electrical_engineer", label: "Electrical Engineer" },
  { value: "site_survey_engineer", label: "Site Survey Engineer" },
  { value: "project_coordinator", label: "Project Coordinator" },
  { value: "om_technician", label: "O&M Technician" },
  { value: "service_engineer", label: "Service Engineer" },
  { value: "monitoring_analyst", label: "Monitoring Analyst" },
  { value: "intern", label: "Intern" },
  { value: "service_coordinator", label: "Service Coordinator" },
  { value: "isphere_green_head", label: "Isphere Green head" },
  { value: "sub_admin", label: "Sub Admin" },
  { value: "marketing_executive", label: "Marketing Executive" },
  { value: "finance_executive", label: "Finance Executive" },
  { value: "finance_manager", label: "Finance Manager" },
  { value: "finance_head", label: "Finance Head" },
];

export const EMPLOYEE_POSITION_MAP: Record<string, string> = {
  solar_design_engineer: "Solar Design Engineer",
  electrical_engineer: "Electrical Engineer",
  site_survey_engineer: "Site Survey Engineer",
  project_coordinator: "Project Coordinator",
  om_technician: "O&M Technician",
  service_engineer: "Service Engineer",
  monitoring_analyst: "Monitoring Analyst",
  intern: "Intern",
  service_coordinator: "Service Coordinator",
  isphere_green_head: "Isphere Green head",
  sub_admin: "Sub Admin",
  marketing_executive: "Marketing Executive",
  finance_executive: "Finance Executive",
  finance_manager: "Finance Manager",
  finance_head: "Finance Head",
  accountant: "Accountant",
  other: "Other",
};

export const getPositionLabel = (positionValue: string): string => {
  return EMPLOYEE_POSITION_MAP[positionValue] || positionValue;
};
