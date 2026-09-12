import {
  Users,
  Briefcase,
  Wrench,
  Package,
  Calendar,
  FileCheck,
  Truck,
  GraduationCap,
  FileText,
  HardHat,
  LucideIcon,
  LayoutDashboard,
  Shield,
  Leaf,
  Layers,
} from "lucide-react";

export interface SpecializedSection {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  category: "Service Coordinator" | "Inventory Coordinator" | "Service & Executive";
  description: string;
  defaultForRoles?: string[]; // Roles that get this by default even without explicit permission
}

export const SPECIALIZED_SECTIONS: SpecializedSection[] = [
  // ─── Service Coordinator Modules ──────────────────────────────────────────
  {
    id: "service_dashboard",
    name: "Service Coordinator Dashboard",
    href: "/subadmin/dashboard",
    icon: LayoutDashboard,
    category: "Service Coordinator",
    description: "Full Service Coordinator Operations Dashboard with real-time KPI metrics, complaints triage, and dispatch controls.",
    defaultForRoles: ["sub_admin", "service_coordinator"],
  },
  {
    id: "service_partner_leads",
    name: "Partners Lead",
    href: "/subadmin/partner-leads",
    icon: Users,
    category: "Service Coordinator",
    description: "Access and track channel partner leads, referrals, and onboarding pipelines.",
    defaultForRoles: ["sub_admin", "service_coordinator"],
  },
  {
    id: "service_customers",
    name: "Customer Desk",
    href: "/subadmin/customers",
    icon: Users,
    category: "Service Coordinator",
    description: "Manage coordinator-level customer listings, site allocations, and service history.",
    defaultForRoles: ["sub_admin", "service_coordinator"],
  },
  {
    id: "service_complaints",
    name: "Complaints Resolution",
    href: "/subadmin/complaints",
    icon: Wrench,
    category: "Service Coordinator",
    description: "Manage, assign, and resolve customer support tickets and equipment breakdowns.",
    defaultForRoles: ["sub_admin", "service_coordinator"],
  },
  {
    id: "service_amc",
    name: "AMC Management",
    href: "/subadmin/amc-management",
    icon: Calendar,
    category: "Service Coordinator",
    description: "Track annual maintenance contracts, upcoming scheduled visits, and renewals.",
    defaultForRoles: ["sub_admin", "service_coordinator"],
  },
  {
    id: "service_employees",
    name: "Coordinator Team Desk",
    href: "/subadmin/employees",
    icon: Users,
    category: "Service Coordinator",
    description: "Coordinate field technician schedules, zone allocations, and active dispatch status.",
    defaultForRoles: ["sub_admin", "service_coordinator"],
  },
  {
    id: "service_calendar",
    name: "Operations Calendar",
    href: "/subadmin/calendar",
    icon: Calendar,
    category: "Service Coordinator",
    description: "View synchronized schedule of site surveys, installation slots, and maintenance visits.",
    defaultForRoles: ["sub_admin", "service_coordinator"],
  },

  // ─── Inventory Coordinator Modules ────────────────────────────────────────
  {
    id: "inventory_dashboard",
    name: "Inventory Coordinator Dashboard",
    href: "/inventory/dashboard",
    icon: LayoutDashboard,
    category: "Inventory Coordinator",
    description: "Inventory Overview Dashboard with stock valuations, incoming batches, and warehouse dispatch KPIs.",
    defaultForRoles: ["inventory_executive"],
  },
  {
    id: "inventory_ledger",
    name: "Inventory Ledger & Stock",
    href: "/inventory/inventory",
    icon: Package,
    category: "Inventory Coordinator",
    description: "Track panel stock, inverters, cabling inventory, warehouse transfers, and batch dispatch logs.",
    defaultForRoles: ["inventory_executive"],
  },
  {
    id: "inventory_customers",
    name: "Inventory Customers",
    href: "/inventory/customers",
    icon: Users,
    category: "Inventory Coordinator",
    description: "Manage customer equipment delivery records, serial allocations, and warranty registrations.",
    defaultForRoles: ["inventory_executive"],
  },

  // ─── Service Executive & EPC Modules ──────────────────────────────────────
  {
    id: "service_exec_dashboard",
    name: "Service & Executive Dashboard",
    href: "/service-executive/dashboard?tab=overview",
    icon: LayoutDashboard,
    category: "Service & Executive",
    description: "High-level Executive Dashboard with total solar capacity, project completion, and installer team health.",
    defaultForRoles: ["service_executive_head", "isphere_green_head"],
  },
  {
    id: "service_exec_epc",
    name: "EPC Contractors Hub",
    href: "/service-executive/dashboard?tab=epc",
    icon: HardHat,
    category: "Service & Executive",
    description: "Oversee EPC engineering contractors, site milestone progress, and sign-offs.",
    defaultForRoles: ["service_executive_head", "isphere_green_head"],
  },
  {
    id: "service_exec_projects",
    name: "Solar Projects Overview",
    href: "/service-executive/dashboard?tab=projects",
    icon: Briefcase,
    category: "Service & Executive",
    description: "End-to-end solar plant project execution pipeline and stage-wise deliverables.",
    defaultForRoles: ["service_executive_head", "isphere_green_head"],
  },
  {
    id: "service_exec_installers",
    name: "Certified Installer Teams",
    href: "/service-executive/dashboard?tab=installers",
    icon: Wrench,
    category: "Service & Executive",
    description: "Manage verified installer squads, daily commissioning tasks, and site quality reports.",
    defaultForRoles: ["service_executive_head", "isphere_green_head"],
  },
  {
    id: "service_exec_liaisoning",
    name: "Liaisoning & Experts",
    href: "/service-executive/dashboard?tab=liaisoning",
    icon: FileCheck,
    category: "Service & Executive",
    description: "Coordinate DISCOM net-metering approvals, CEIG inspections, and government subsidies.",
    defaultForRoles: ["service_executive_head", "isphere_green_head"],
  },
  {
    id: "service_exec_supplychain",
    name: "Supply Chain Logistics",
    href: "/service-executive/dashboard?tab=supplychain",
    icon: Truck,
    category: "Service & Executive",
    description: "Monitor multi-city freight movements, material deliveries, and supplier tracking.",
    defaultForRoles: ["service_executive_head", "isphere_green_head"],
  },
  {
    id: "service_exec_knowledge",
    name: "Knowledge & Experts",
    href: "/service-executive/dashboard?tab=knowledge",
    icon: GraduationCap,
    category: "Service & Executive",
    description: "Technical schematics, equipment datasheets, troubleshooting guides, and expert directory.",
    defaultForRoles: ["service_executive_head", "isphere_green_head"],
  },
  {
    id: "service_exec_reports",
    name: "Reports & Analytics",
    href: "/service-executive/dashboard?tab=reports",
    icon: FileText,
    category: "Service & Executive",
    description: "High-level performance metrics, SLA compliance graphs, and regional efficiency reports.",
    defaultForRoles: ["service_executive_head", "isphere_green_head"],
  },
];

export const PERMISSION_PRESETS: Record<string, { label: string; description: string; ids: string[] }> = {
  service_coordinator_suite: {
    label: "Service Coordinator Suite",
    description: "Grant full access to Service Coordinator Dashboard, Partners Lead, Complaints, AMC Management, Operations Calendar, Customer Desk, and Team Desk.",
    ids: [
      "service_dashboard",
      "service_partner_leads",
      "service_customers",
      "service_complaints",
      "service_amc",
      "service_employees",
      "service_calendar",
    ],
  },
  inventory_suite: {
    label: "Inventory Coordinator Suite",
    description: "Grant full access to Inventory Dashboard, Ledger, Stock Registry, Delivery Customers, and Barcode Scanner.",
    ids: [
      "inventory_dashboard",
      "inventory_ledger",
      "inventory_customers",
    ],
  },
  service_executive_suite: {
    label: "Service & Executive Suite",
    description: "Grant full access to Executive Dashboard, EPC Hub, Solar Projects, Installer Squads, Liaisoning, Supply Chain, and Analytics.",
    ids: [
      "service_exec_dashboard",
      "service_exec_epc",
      "service_exec_projects",
      "service_exec_installers",
      "service_exec_liaisoning",
      "service_exec_supplychain",
      "service_exec_knowledge",
      "service_exec_reports",
    ],
  },
  all_access: {
    label: "All Specialized Modules",
    description: "Grant access to every specialized coordinator and executive section across the platform.",
    ids: SPECIALIZED_SECTIONS.map((s) => s.id),
  },
};

/**
 * Checks if a user has access to a specific section key.
 * - Super Admin & Admin have access to everything.
 * - Sub Admin has Service Coordinator sections by default.
 * - Inventory Executive has Inventory sections by default.
 * - Service & Executive Head has Executive sections by default.
 * - Any user with explicit `user.permissions` containing the section ID gets access.
 */
export function hasSectionAccess(
  user: { role?: string; jobRole?: string; permissions?: string[] } | null | undefined,
  sectionId: string
): boolean {
  if (!user) return false;
  if (user.role === "super_admin" || user.role === "admin") return true;

  const section = SPECIALIZED_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return false;

  // Check explicit permissions array first
  const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
  if (
    userPermissions.includes(sectionId) ||
    userPermissions.includes("*") ||
    userPermissions.includes("all_access") ||
    userPermissions.includes("all")
  ) {
    return true;
  }

  // Check preset-based permissions if any preset key was assigned directly
  for (const perm of userPermissions) {
    const preset = PERMISSION_PRESETS[perm];
    if (preset && preset.ids.includes(sectionId)) {
      return true;
    }
  }

  // Check role-based defaults
  const normalizedRole = (user.role || "").toLowerCase();
  const normalizedJobRole = (user.jobRole || "").toLowerCase().replace(/[\s-_]+/g, "");

  if (section.defaultForRoles) {
    for (const defRole of section.defaultForRoles) {
      const normDef = defRole.toLowerCase().replace(/[\s-_]+/g, "");
      if (normalizedRole.includes(normDef) || normalizedJobRole.includes(normDef)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Returns all specialized sections accessible to the given user.
 */
export function getAllowedSpecializedSections(
  user: { role?: string; jobRole?: string; permissions?: string[] } | null | undefined
): SpecializedSection[] {
  if (!user) return [];
  return SPECIALIZED_SECTIONS.filter((sec) => hasSectionAccess(user, sec.id));
}
