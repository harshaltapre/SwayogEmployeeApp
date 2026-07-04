/**
 * Employee Position Options
 * Used throughout the admin section for employee management
 */

export const EMPLOYEE_POSITIONS = [
  { value: "solar_design_engineer", label: "Solar Design Engineer" },
  { value: "electrical_engineer", label: "Electrical Engineer" },
  { value: "site_survey_engineer", label: "Site Survey Engineer" },
  { value: "om_technician", label: "O&M Technician" },
  { value: "service_engineer", label: "Service Engineer" },
  { value: "monitoring_analyst", label: "Monitoring Analyst" },
  { value: "intern", label: "Intern" },
  { value: "sub_admin", label: "Sub Admin" },
];

export const EMPLOYEE_POSITION_MAP: Record<string, string> = {
  solar_design_engineer: "Solar Design Engineer",
  electrical_engineer: "Electrical Engineer",
  site_survey_engineer: "Site Survey Engineer",
  om_technician: "O&M Technician",
  service_engineer: "Service Engineer",
  monitoring_analyst: "Monitoring Analyst",
  intern: "Intern",
  sub_admin: "Sub Admin",
  other: "Other",
};

export const getPositionLabel = (positionValue: string): string => {
  return EMPLOYEE_POSITION_MAP[positionValue] || positionValue;
};
