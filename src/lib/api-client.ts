/**
 * Transitional API client.
 * Auth and selected modules are backend-backed, while remaining modules retain mock fallbacks during migration.
 */
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, type UserRole } from "@/lib/auth";
import { getEmployeeServicesMap, getMatchedEmployeeIds, setEmployeeServices } from "@/lib/service-routing";
import { notifyEmployeeDataChanged } from "@/lib/entity-sync";
import { format } from "date-fns";

import { resolveConfiguredApiBaseUrl } from "@/lib/resolve-api-base-url";

// ─── Type Definitions ──────────────────────────────────────────────────────────

type AdminDashboardSummary = {
  totalCustomers: number;
  activeInstallations: number;
  pendingServices: number;
  monthlyRevenue: number;
  openComplaints: number;
  customersTrend: number;
  revenueTrend: number;
};

type RevenueChart = Array<{ month: string; revenue: number }>;

type ComplaintStats = { new: number; assigned: number; inProgress: number; resolved: number };

type InstallationChart = Array<{ month: string; count: number }>;

type RecentActivityRecord = {
  id: number;
  type: string;
  description: string;
  customerName: string;
  assignedTo: string;
  status: string;
  createdAt: string;
};

type CustomerAmcStatus = "active" | "expired" | "none";
type CustomerStatus = "active" | "inactive";
export type ClientType = "corporate" | "post_paid" | "pre_paid" | "on_call" | "free_service";

export type CustomerGenerationSummary = {
  customerId: number;
  inverterBrand: string;
  totalGeneration: number;
  dailyGeneration: number;
  peakPower: number;
  lastUpdated: string;
  isSimulated?: boolean;
};

export type CustomerGenerationHistoryPoint = {
  date: string;
  label: string;
  generation: number;
};

export type CustomerDashboardSummary = {
  customer: CustomerRecord;
  serviceRequestStats: {
    total: number;
    pending: number;
    scheduled: number;
    completed: number;
  };
};

export type CustomerRecord = {
  id: number;
  customerCode?: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  systemSizeKw: number;
  projectStage?: number;
  installationDate: string;
  warrantyExpiry: string | null;
  panelBrand: string | null;
  inverterBrand: string | null;
  inverterApiKey?: string | null;
  inverterDeviceSn?: string | null;
  amcStatus: CustomerAmcStatus;
  amcExpiryDate: string | null;
  status: CustomerStatus;
  partnerId?: string | null;
  loginId?: string;
  generatedPassword?: string;
  inverterLoginId?: string | null;
  inverterPassword?: string | null;
  portalLoginId?: string;
  portalPassword?: string | null;
  clientType?: ClientType;
  consumerNumber?: string;
  monthlyCleaningRate?: number;
  remarks?: string;
  cleaningsPerMonth?: number;
  cleaningWindow1?: string;
  cleaningWindow2?: string;
  cleaningWindow3?: string;
  cleaningWindow4?: string;
  cleaningWindow5?: string;
  cleaningWindow6?: string;
  cleaningWindow7?: string;
  cleaningWindow8?: string;
  completedVisits?: number;
  pendingVisits?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  paymentTerms?: string;
  assignedEmployeeId?: string;
  commissionAmount?: number;
  commissionStatus?: "PENDING" | "COMPLETED";
  commissionProofUrl?: string | null;
  commissionPaidAt?: string | null;
  apartmentId?: number | null;
  apartment?: { id: number; name: string; address: string; city: string } | null;
  assignedEmployee?: { id: string; name: string } | null;
};

export type ApartmentRecord = {
  id: number;
  name: string;
  address: string;
  city: string;
  createdAt: string;
  updatedAt: string;
  customers?: CustomerRecord[];
  _count?: { customers: number };
};

export type AmcVisitRecord = {
  id: string;
  customerId: number;
  scheduledDate: string;
  scheduledTime?: string | null;
  status: "pending" | "completed" | "missed";
  completedAt?: string;
  notes?: string;
  assignedEmployeeId?: string;
  customer?: { 
    fullName: string; 
    city: string; 
    phoneNumber: string;
    apartmentId?: number | null;
    apartment?: { id: number; name: string; address: string; city: string } | null;
  };
  cleaningNumber?: number | null;
  timeSlot?: string | null;
  completedByEmployeeId?: string | null;
  completedByName?: string | null;
  visitNotes?: string | null;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
};

type ListCustomersParams = {
  search?: string;
  amcStatus?: CustomerAmcStatus;
  status?: CustomerStatus;
  city?: string;
  partnerId?: string;
  limit?: number;
};

export type CreateCustomerInput = {
  fullName: string;
  email: string;
  phoneNumber: string;
  city: string;
  address: string;
  systemSizeKw: number;
  installationDate: string;
  warrantyExpiry?: string | null;
  panelBrand?: string;
  inverterBrand?: string;
  inverterModel?: string;
  inverterApiKey?: string;
  inverterDeviceSn?: string;
  inverterLoginId?: string;
  inverterPassword?: string;
  portalLoginId?: string;
  portalPassword?: string;
  amcStatus?: CustomerAmcStatus;
  amcExpiryDate?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  cleaningsPerMonth?: number;
  status?: CustomerStatus;
  partnerId?: string;
  projectStage?: number;
  commissionAmount?: number;
  monthlyCleaningRate?: number;
  paymentTerms?: string;
  remarks?: string;
  apartmentId?: number | null;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput> & {
  clientType?: ClientType;
  consumerNumber?: string;
  monthlyCleaningRate?: number;
  remarks?: string;
  cleaningsPerMonth?: number;
  cleaningWindow1?: string;
  cleaningWindow2?: string;
  cleaningWindow3?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  paymentTerms?: string;
  commissionAmount?: number;
};

export type InvoiceRecord = {
  id: string;
  invoiceNumber?: string;
  customerId: number | string;
  description: string;
  amount: number;
  date: string;
  status: string;
  invoiceType?: string;
  paymentMethod?: string;
  proofUrl?: string | null;
};

export type CreateInvoiceInput = Omit<InvoiceRecord, "id">;
export type UpdateInvoiceInput = Partial<CreateInvoiceInput>;

export type EmployeeRecord = {
  id: number;
  userId?: string;
  loginId?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  zone: string;
  monthlySalaryInr?: number;
  status: "active" | "inactive" | "on_leave";
  rating: number;
  activeTasksCount: number;
  jobsCompletedThisMonth: number;
  joiningDate: string;
  services: string[];
  tasks: Array<unknown>;
  reportingManagerId?: string | null;
  department?: string | null;
  portalPassword?: string;
};

type ListEmployeesParams = {
  search?: string;
  offset?: number;
  limit?: number;
};

type InternalUserRole = "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE" | "PARTNER" | "CUSTOMER";

export type CreateInternalUserInput = {
  fullName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role: Exclude<InternalUserRole, "CUSTOMER">;
  businessName?: string;
  jobRole?: string;
  zone?: string;
  monthlySalaryInr?: number;
  serviceCategories?: string[];
  reportingManagerId?: string | null;
};

export type UpdateInternalUserInput = {
  fullName?: string;
  phoneNumber?: string | null;
  isActive?: boolean;
  jobRole?: string;
  zone?: string;
  monthlySalaryInr?: number | null;
  serviceCategories?: string[];
  reportingManagerId?: string | null;
  portalPassword?: string;
};

export type TransferInternalUserTeamInput = {
  strategy: "REASSIGN" | "UNASSIGN" | "ASSIGN_TO_MANAGER_MANAGER";
  newManagerId?: string;
  subtreePolicy?: "PRESERVE_SUBTREE" | "CASCADE_TO_NEW_MANAGER";
  reason?: string;
};

type InternalUserRecord = {
  id: string;
  loginId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: InternalUserRole;
  isActive: boolean;
  createdAt: string;
  department?: {
    id: string;
    name: string;
  } | null;
  reportingManagerId?: string | null;
  employeeProfile?: {
    zone: string | null;
    jobRole: string;
    monthlySalaryInr?: number | null;
    serviceCategories?: string[] | null;
  } | null;
  partnerProfile?: {
    serviceZone?: string | null;
    businessName?: string | null;
  } | null;
};

const INVOICES_STORAGE_KEY = "swayog_mock_invoices";

function getStoredInvoices(): InvoiceRecord[] {
  try {
    const stored = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { }
  return [];
}

const mockComplaints: any[] = [];

export type InventoryRecord = {
  id: number | string;
  sku: string;
  name: string;
  category: string;
  inStock: number;
  minThreshold: number;
  supplier: string;
  isLowStock: boolean;
  pricePerUnit: number;
  entryDate: string;
};

export type DispatchedMaterialRecord = {
  id: string;
  customerId: number;
  customerName: string;
  itemId: string | number;
  itemName: string;
  quantity: number;
  dispatchedAt: string;
  notes?: string;
  pricePerUnit?: number;
};

const INVENTORY_STORAGE_KEY = "swayog_inventory_registry";
const INVENTORY_CHANGED_EVENT = "swayog-inventory-updated";
const DISPATCHED_MATERIALS_STORAGE_KEY = "swayog_dispatched_materials";
const DISPATCH_CHANGED_EVENT = "swayog-dispatch-updated";

const DEFAULT_INVENTORY_SEED: InventoryRecord[] = [
  { id: 1, sku: "ER-3M", name: "Earthing Rod with Nut Bolts 3m", category: "Earthing", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 2, sku: "EDC-16-GR", name: "Earthing Down Conductor 16 sq mm Green", category: "Earthing", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 3, sku: "EPC-FRP", name: "Earthing Pit Cover FRP", category: "Earthing", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 4, sku: "EBFC-25KG", name: "Earthing Backfill Compound 25 Kg Bag", category: "Earthing", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 5, sku: "LA-01", name: "Lightning Arrestor", category: "Protection", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 6, sku: "ACC-4-CU", name: "AC Cable 1C x 4 sq mm Cu Flexible", category: "Cables", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 7, sku: "DCC-4-RB", name: "DC Cable 4 sq mm (Red & Black)", category: "Cables", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 8, sku: "SP-2X2", name: "Structure Pipe 2x2", category: "Structure", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 9, sku: "SP-1.5X1.5", name: "Structure Pipe 1.5x1.5", category: "Structure", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 10, sku: "SP-1X1", name: "Structure Pipe 1x1", category: "Structure", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 11, sku: "BP-01", name: "Base Plate", category: "Structure", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 12, sku: "AB-01", name: "Anchor Bolts", category: "Hardware", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 13, sku: "MR-01", name: "Monorail", category: "Structure", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 14, sku: "MC-01", name: "Mid Clamp", category: "Hardware", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 15, sku: "EC-01", name: "End Clamp", category: "Hardware", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 16, sku: "RV-01", name: "Rivet", category: "Hardware", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 17, sku: "SB-01", name: "Silicon Bottle", category: "Chemicals", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 18, sku: "CP-25", name: "Conduit Pipe 25 mm", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 19, sku: "MC-25-PVC", name: "Mounting Clamps 25 mm PVC", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 20, sku: "EL-25", name: "25 mm Elbow", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 21, sku: "T-25", name: "25 mm T", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 22, sku: "EIT-01", name: "Electrical Insulation Tape", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 23, sku: "CT-PKT", name: "Cable Tie Packet", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 24, sku: "FC-1IN", name: "Flexible Conduit – 1 inch", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 25, sku: "JB-SS", name: "J Bolt SS with Single Washer and Nut", category: "Hardware", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 26, sku: "MC4-PR", name: "MC4 Connector Pair", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 27, sku: "INV-01", name: "Inverter", category: "Electronics", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 28, sku: "DCR-PNL", name: "DCR Panel", category: "Electronics", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 29, sku: "ACDB-01", name: "ACDB", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 30, sku: "DCDB-01", name: "DCDB", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 31, sku: "WPL-SB", name: "Waterproofing Liquid (small bottle)", category: "Chemicals", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 32, sku: "DB-01", name: "Dewalt Bottle", category: "Tools", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
  { id: 33, sku: "PVCD-01", name: "PVC Duct", category: "Electrical", inStock: 100, minThreshold: 10, supplier: "Swayog Internal", isLowStock: false, pricePerUnit: 0, entryDate: new Date().toISOString() },
];

function normalizeInventoryRecord(raw: any): InventoryRecord {
  const inStock = Number.isFinite(Number(raw?.inStock)) ? Math.max(0, Number(raw.inStock)) : 0;
  const minThreshold = Number.isFinite(Number(raw?.minThreshold)) ? Math.max(0, Number(raw.minThreshold)) : 0;
  const pricePerUnit = Number.isFinite(Number(raw?.pricePerUnit)) ? Math.max(0, Number(raw.pricePerUnit)) : 0;
  return {
    id: raw?.id ?? `${Date.now()}`,
    sku: String(raw?.sku ?? "").trim(),
    name: String(raw?.name ?? "").trim(),
    category: String(raw?.category ?? "misc").trim(),
    inStock,
    minThreshold,
    supplier: String(raw?.supplier ?? "").trim(),
    isLowStock: inStock <= minThreshold,
    pricePerUnit,
    entryDate: String(raw?.entryDate ?? new Date().toISOString()),
  };
}

function getStoredInventoryRecords(): InventoryRecord[] {
  try {
    const stored = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!stored) {
      setStoredInventoryRecords(DEFAULT_INVENTORY_SEED);
      return DEFAULT_INVENTORY_SEED;
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      setStoredInventoryRecords(DEFAULT_INVENTORY_SEED);
      return DEFAULT_INVENTORY_SEED;
    }
    return parsed.map(normalizeInventoryRecord);
  } catch {
    setStoredInventoryRecords(DEFAULT_INVENTORY_SEED);
    return DEFAULT_INVENTORY_SEED;
  }
}

function setStoredInventoryRecords(items: InventoryRecord[]): void {
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
}

function notifyInventoryChanged(): void {
  window.dispatchEvent(new Event(INVENTORY_CHANGED_EVENT));
}

const mockFinancialSummary = {
  totalRevenue: 0,
  collected: 0,
  pendingDues: 0,
  collectionRate: 0,
};

type FinancialSummary = typeof mockFinancialSummary;

const mockTasks: any[] = [];

export type ComplaintRecord = {
  id: number;
  ticketId: string;
  type: string;
  customerName: string;
  zone?: string;
  priority: "low" | "medium" | "high";
  status: string;
  slaDeadline: string;
  resolvedAt: string | null;
  createdAt: string;
};

export type TaskRecord = {
  id: number;
  jobType: string;
  description: string;
  customerName: string;
  customerPhone: string;
  address: string;
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  scheduledTime: string;
  employeeId?: number;
  employeeUserId?: string;
  completionMessage?: string | null;
  completionDocumentUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  completedAt?: string | null;
  taskRate?: number | null;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  beforeLatitude?: number | null;
  beforeLongitude?: number | null;
  afterLatitude?: number | null;
  afterLongitude?: number | null;
  customerRating?: number | null;
  customerFeedback?: string | null;
  fixCharges?: number | null;
};

export type CustomerServiceRequestRecord = {
  id: string;
  ticketId: string;
  type: string;
  description: string;
  status: "new" | "in_progress" | "resolved";
  date: string;
  createdAt: string;
};

export type CreateCustomerServiceRequestInput = {
  type: string;
  description: string;
  customerName: string;
  customerPhone: string;
  address: string;
  zone?: string;
};

export type CreateTaskAssignmentInput = {
  // Either a single employeeUserId or multiple employeeUserIds may be provided.
  employeeUserId?: string;
  employeeUserIds?: string[];
  jobType: string;
  description: string;
  customerName: string;
  customerPhone: string;
  address: string;
  scheduledTime: string;
  taskRate?: number | null;
};

export type CreateBulkTaskAssignmentInput = {
  employeeUserIds: string[];
  jobType: string;
  description: string;
  customerName: string;
  customerPhone: string;
  address: string;
  scheduledTime: string;
  taskRate?: number | null;
};

export type CompleteTaskInput = {
  message: string;
  documentUrl?: string;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  beforeLatitude?: number | null;
  beforeLongitude?: number | null;
  afterLatitude?: number | null;
  afterLongitude?: number | null;
};

export type RateTaskInput = {
  customerRating: number;
  customerFeedback?: string | null;
  fixCharges?: number | null;
};

const mockPartnerPayouts: any[] = [];

export type PartnerPayout = typeof mockPartnerPayouts[number];

export type PartnerRecord = {
  id: string; // userId
  partnerProfileId?: string;
  name: string;
  email?: string;
  companyName: string;
  phone: string;
  zone: string;
  status: "active" | "inactive";
  activeProjects: number;
  totalCommissionEarned: number;
  pendingPayout: number;
};

export type CreatePartnerInput = {
  fullName: string;
  companyName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  zone: string;
};

const mockWorkDescriptions: Array<{ employeeId: number | string; description: string; timestamp: string }> = [];

const CUSTOMER_SERVICE_REQUESTS_STORAGE_KEY = "swayog_customer_service_requests";
const DYNAMIC_COMPLAINTS_STORAGE_KEY = "swayog_dynamic_complaints";

export function getStoredCustomerServiceRequests(): CustomerServiceRequestRecord[] {
  try {
    const raw = localStorage.getItem(CUSTOMER_SERVICE_REQUESTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomerServiceRequestRecord[]) : [];
  } catch {
    return [];
  }
}

export function setStoredCustomerServiceRequests(rows: CustomerServiceRequestRecord[]): void {
  localStorage.setItem(CUSTOMER_SERVICE_REQUESTS_STORAGE_KEY, JSON.stringify(rows));
}

export function getStoredDynamicComplaints(): any[] {
  try {
    const raw = localStorage.getItem(DYNAMIC_COMPLAINTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setStoredDynamicComplaints(rows: any[]): void {
  localStorage.setItem(DYNAMIC_COMPLAINTS_STORAGE_KEY, JSON.stringify(rows));
}


type AuthUser = {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
  avatarInitials: string;
  jobRole?: string;
  reportingManagerId?: string | null;
  employeeCode?: string | null;
};

type AuthSession = {
  token: string;
  refreshToken?: string;
  user: AuthUser;
};

type LoginRole = "super_admin" | "admin" | "employee" | "sub_admin" | "partner" | "customer" | "department_head" | "team_lead";

type LoginInput = {
  identifier?: string;
  email?: string;
  password: string;
  role: LoginRole;
};

const roleToBackendRole: Record<LoginRole, string> = {
  super_admin: "SUPER_ADMIN",
  admin: "ADMIN",
  employee: "EMPLOYEE",
  sub_admin: "SUB_ADMIN",
  partner: "PARTNER",
  customer: "CUSTOMER",
  department_head: "DEPARTMENT_HEAD",
  team_lead: "TEAM_LEAD",
};

function toInitials(name: string): string {
  const parts = name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return parts.join("") || "US";
}

function normalizeFrontendRole(rawRole: string): UserRole {
  const lower = rawRole.trim().toLowerCase();
  if (lower === "super_admin" || lower === "super-admin" || lower === "superadmin") return "super_admin";
  if (lower === "admin") return "admin";
  if (lower === "employee") return "employee";
  if (lower === "sub_admin" || lower === "sub-admin" || lower === "subadmin") return "sub_admin";
  if (lower === "partner") return "partner";
  if (lower === "customer") return "customer";

  const upper = rawRole.trim().toUpperCase();
  if (upper === "SUPER_ADMIN") return "super_admin";
  if (upper === "ADMIN") return "admin";
  if (upper === "EMPLOYEE") return "employee";
  if (upper === "SUB_ADMIN") return "sub_admin";
  if (upper === "PARTNER") return "partner";
  if (upper === "CUSTOMER") return "customer";

  throw { error: `Unsupported role '${rawRole}' received from auth service.` };
}

function parseErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const maybe = payload as Record<string, unknown>;
    if (typeof maybe.error === "string") return maybe.error;
    if (typeof maybe.message === "string") return maybe.message;
  }
  return fallback;
}

function getResolvedIdentifier(data: LoginInput): string {
  return (data.identifier ?? data.email ?? "").trim();
}

function getConfiguredApiBaseUrl(): string | null {
  return resolveConfiguredApiBaseUrl();
}

export function getEffectiveApiBaseUrl(): string | null {
  return getConfiguredApiBaseUrl();
}

function getAuthApiBaseUrl(): string | null {
  return getConfiguredApiBaseUrl();
}

function getApiBaseUrl(): string | null {
  return getConfiguredApiBaseUrl();
}

function buildApiUrl(apiBaseUrl: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (/\/api\/v\d+$/i.test(apiBaseUrl)) {
    return `${apiBaseUrl}${normalizedPath}`;
  }

  return `${apiBaseUrl}/api/v1${normalizedPath}`;
}

export function buildAssetUrlFromPath(assetPath?: string | null): string | null {
  if (!assetPath || typeof assetPath !== "string") {
    return null;
  }

  if (/^(https?|data):/i.test(assetPath)) {
    return assetPath;
  }

  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return null;
  }

  const base = apiBaseUrl.replace(/\/api\/v\d+$/i, "").replace(/\/$/, "");
  const normalizedPath = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  return `${base}${normalizedPath}`;
}

function getAuthHeaders(initHeaders?: HeadersInit): Headers {
  const headers = new Headers(initHeaders);
  const token = useAuth.getState().token;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

let refreshSessionPromise: Promise<string | null> | null = null;

async function refreshAccessToken(apiBaseUrl: string): Promise<string | null> {
  if (refreshSessionPromise) {
    return refreshSessionPromise;
  }

  refreshSessionPromise = (async () => {
    const authState = useAuth.getState();
    const refreshToken = authState.refreshToken;
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(buildApiUrl(apiBaseUrl, "/auth/refresh"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        return null;
      }

      const session = (payload as { data?: any } | null)?.data;
      if (!session?.accessToken || !session?.user) {
        return null;
      }

      const userRole = normalizeFrontendRole(String(session.user.role ?? ""));
      const userName = String(session.user.fullName ?? session.user.name ?? authState.user?.name ?? "User");
      const userEmail = String(session.user.email ?? authState.user?.email ?? "");
      const jobRole = resolveSessionJobRole(session.user);

      useAuth.getState().login(
        String(session.accessToken),
        {
          id: session.user.id ?? authState.user?.id ?? userEmail,
          name: userName,
          email: userEmail,
          role: userRole,
          jobRole,
          avatarInitials: String(session.user.avatarInitials ?? toInitials(userName)),
          reportingManagerId: session.user.reportingManagerId ?? null,
        },
        typeof session.refreshToken === "string" ? session.refreshToken : refreshToken,
      );

      return String(session.accessToken);
    } catch {
      return null;
    }
  })();

  try {
    return await refreshSessionPromise;
  } finally {
    refreshSessionPromise = null;
  }
}

async function executeApiRequest(apiBaseUrl: string, path: string, init?: RequestInit): Promise<Response> {
  const headers = getAuthHeaders(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(buildApiUrl(apiBaseUrl, path), {
    ...init,
    headers,
  });
}

export async function requestApi<T>(path: string, init?: RequestInit): Promise<T> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    throw { error: "Backend API URL is not configured." };
  }

  let response = await executeApiRequest(apiBaseUrl, path, init).catch(() => {
    throw { error: "Unable to reach API server. Check backend URL or network connection." };
  });

  if (response.status === 401) {
    const newAccessToken = await refreshAccessToken(apiBaseUrl);
    if (!newAccessToken) {
      useAuth.getState().logout();
      throw { error: "Session expired. Please login again." };
    }

    response = await executeApiRequest(apiBaseUrl, path, init).catch(() => {
      throw { error: "Unable to reach API server. Check backend URL or network connection." };
    });
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw { error: parseErrorMessage(payload, `Request failed with status ${response.status}`) };
  }

  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

function normalizeDateValue(input: string | null | undefined): string | null {
  if (!input) {
    return null;
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function resolveSessionJobRole(rawUser: any): string | undefined {
  const candidate =
    rawUser?.jobRole ??
    rawUser?.employeeProfile?.jobRole ??
    rawUser?.designationTitle;

  if (typeof candidate !== "string") {
    return undefined;
  }

  const normalized = candidate.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeCustomerRecord(raw: any): CustomerRecord {
  return {
    id: Number(raw?.id ?? 0),
    customerCode: typeof raw?.customerCode === "string" ? raw.customerCode : undefined,
    name: String(raw?.name ?? raw?.fullName ?? ""),
    email: String(raw?.email ?? ""),
    phone: String(raw?.phone ?? raw?.phoneNumber ?? ""),
    city: String(raw?.city ?? ""),
    address: String(raw?.address ?? ""),
    systemSizeKw: Number(raw?.systemSizeKw ?? 0),
    projectStage: Number(raw?.projectStage ?? 0),
    installationDate: normalizeDateValue(raw?.installationDate) ?? new Date().toISOString(),
    warrantyExpiry: normalizeDateValue(raw?.warrantyExpiry),
    panelBrand: typeof raw?.panelBrand === "string" ? raw.panelBrand : null,
    inverterApiKey: typeof raw?.inverterApiKey === "string" ? raw.inverterApiKey : null,
    inverterDeviceSn: typeof raw?.inverterDeviceSn === "string" ? raw.inverterDeviceSn : null,
    inverterBrand: typeof raw?.inverterBrand === "string" ? raw.inverterBrand : null,
    amcStatus: String(raw?.amcStatus ?? "none").toLowerCase() as CustomerAmcStatus,
    amcExpiryDate: normalizeDateValue(raw?.amcExpiryDate),
    status: String(raw?.status ?? "active").toLowerCase() as CustomerStatus,
    partnerId: typeof raw?.partnerId === "string" ? raw.partnerId : null,
    loginId: typeof raw?.loginId === "string" ? raw.loginId : undefined,
    generatedPassword: typeof raw?.generatedPassword === "string" ? raw.generatedPassword : undefined,
    inverterLoginId: typeof raw?.inverterLoginId === "string" ? raw.inverterLoginId : null,
    inverterPassword: typeof raw?.inverterPassword === "string" ? raw.inverterPassword : null,
    portalLoginId: typeof raw?.portalLoginId === "string" ? raw.portalLoginId : undefined,
    portalPassword: typeof raw?.portalPassword === "string" ? raw.portalPassword : null,
    clientType: raw?.clientType as ClientType,
    consumerNumber: raw?.consumerNumber,
    monthlyCleaningRate: raw?.monthlyCleaningRate,
    remarks: raw?.remarks,
    cleaningsPerMonth: raw?.cleaningsPerMonth,
    cleaningWindow1: raw?.cleaningWindow1,
    cleaningWindow2: raw?.cleaningWindow2,
    cleaningWindow3: raw?.cleaningWindow3,
    cleaningWindow4: raw?.cleaningWindow4,
    cleaningWindow5: raw?.cleaningWindow5,
    cleaningWindow6: raw?.cleaningWindow6,
    cleaningWindow7: raw?.cleaningWindow7,
    cleaningWindow8: raw?.cleaningWindow8,
    contractStartDate: normalizeDateValue(raw?.contractStartDate) ?? undefined,
    contractEndDate: normalizeDateValue(raw?.contractEndDate) ?? undefined,
    paymentTerms: raw?.paymentTerms,
    assignedEmployeeId: raw?.assignedEmployeeId,
    commissionAmount: Number(raw?.commissionAmount ?? 0),
    commissionStatus: String(raw?.commissionStatus ?? "PENDING").toUpperCase() as "PENDING" | "COMPLETED",
    commissionProofUrl: typeof raw?.commissionProofUrl === "string" ? raw.commissionProofUrl : null,
    commissionPaidAt: normalizeDateValue(raw?.commissionPaidAt),
    completedVisits: raw?.completedVisits !== undefined ? Number(raw.completedVisits) : undefined,
    pendingVisits: raw?.pendingVisits !== undefined ? Number(raw.pendingVisits) : undefined,
    apartmentId: raw?.apartmentId ? Number(raw.apartmentId) : null,
    apartment: raw?.apartment ? {
      id: Number(raw.apartment.id),
      name: String(raw.apartment.name || ""),
      address: String(raw.apartment.address || ""),
      city: String(raw.apartment.city || ""),
    } : null,
    assignedEmployee: raw?.assignedEmployee ? {
      id: String(raw.assignedEmployee.id),
      name: String(raw.assignedEmployee.fullName || raw.assignedEmployee.name || ""),
    } : null,
  };
}

export function stableNumberFromString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash || 1;
}

function normalizeEmployeeRecord(raw: any): EmployeeRecord {
  const role = String(raw?.role ?? "EMPLOYEE").toLowerCase();
  const defaultName = String(raw?.fullName ?? raw?.name ?? "Employee");
  const stableIdSource = String(raw?.id ?? raw?.loginId ?? `${raw?.email ?? "employee"}`);
  const resolvedUserId = typeof raw?.id === "string" ? raw.id : String(raw?.id ?? stableIdSource);
  const map = getEmployeeServicesMap();
  const rawServices = Array.isArray(raw?.employeeProfile?.serviceCategories)
    ? raw.employeeProfile.serviceCategories
    : [];
  const mappedServices = Array.isArray(map[resolvedUserId]) ? map[resolvedUserId] : [];
  const services = Array.from(
    new Set(
      [...rawServices, ...mappedServices]
        .map((entry) => String(entry ?? "").trim())
        .filter(Boolean),
    ),
  );

  return {
    id: typeof raw?.id === "number" ? raw.id : stableNumberFromString(stableIdSource),
    userId: resolvedUserId,
    loginId: typeof raw?.loginId === "string" ? raw.loginId : undefined,
    name: defaultName,
    email: String(raw?.email ?? ""),
    phone: String(raw?.phoneNumber ?? raw?.phone ?? ""),
    role: raw?.employeeProfile?.jobRole ?? role,
    zone: String(raw?.employeeProfile?.zone ?? raw?.zone ?? "Unassigned"),
    monthlySalaryInr: Number(raw?.employeeProfile?.monthlySalaryInr ?? raw?.monthlySalaryInr ?? 0),
    status: raw?.isActive === false ? "inactive" : "active",
    rating: Number(raw?.rating ?? 4.0),
    activeTasksCount: Number(raw?.activeTasksCount ?? 0),
    jobsCompletedThisMonth: Number(raw?.jobsCompletedThisMonth ?? 0),
    joiningDate: normalizeDateValue(raw?.createdAt ?? raw?.joiningDate) ?? new Date().toISOString(),
    services,
    tasks: Array.isArray(raw?.tasks) ? raw.tasks : [],
    reportingManagerId: raw?.reportingManagerId ? String(raw.reportingManagerId) : null,
    department: raw?.department?.name ?? null,
    portalPassword: typeof raw?.portalPassword === "string" ? raw.portalPassword : undefined,
  };
}

function normalizePartnerRecord(raw: any): PartnerRecord {
  const id = String(raw?.id ?? raw?.userId ?? "").trim();
  const fullName = String(raw?.fullName ?? raw?.name ?? "").trim();
  const businessName = String(raw?.partnerProfile?.businessName ?? raw?.companyName ?? fullName).trim();

  return {
    id,
    partnerProfileId: raw?.partnerProfile?.id,
    name: fullName,
    email: raw?.email,
    companyName: businessName || fullName,
    phone: String(raw?.phoneNumber ?? raw?.phone ?? "").trim(),
    zone: String(raw?.partnerProfile?.serviceZone ?? raw?.zone ?? "Unassigned").trim(),
    status: raw?.isActive === false ? "inactive" : "active",
    activeProjects: Number(raw?.activeProjects ?? 0),
    totalCommissionEarned: Number(raw?.totalCommissionEarned ?? 0),
    pendingPayout: Number(raw?.pendingPayout ?? 0),
  };
}

function buildEmployeesQueryString(params?: ListEmployeesParams): string {
  const query = new URLSearchParams();
  query.set("role", "EMPLOYEE");
  if (params?.search) query.set("search", params.search);
  if (params?.offset) query.set("offset", String(params.offset));
  if (params?.limit) query.set("limit", String(params.limit));
  const serialized = query.toString();
  return serialized.length > 0 ? `?${serialized}` : "";
}

function buildCustomerQueryString(params?: ListCustomersParams): string {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.amcStatus) query.set("amcStatus", params.amcStatus);
  if (params?.status) query.set("status", params.status);
  if (params?.city) query.set("city", params.city);
  if (params?.partnerId) query.set("partnerId", params.partnerId);
  if (params?.limit) query.set("limit", String(params.limit));
  const serialized = query.toString();
  return serialized.length > 0 ? `?${serialized}` : "";
}

async function loginViaBackend(data: LoginInput, apiBaseUrl: string): Promise<AuthSession> {
  const response = await fetch(buildApiUrl(apiBaseUrl, "/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier: getResolvedIdentifier(data),
      password: data.password,
      role: roleToBackendRole[data.role],
    }),
  }).catch(() => {
    throw { error: "Unable to reach auth server. Check backend URL or network connection." };
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const fallbackMsg = `Server error ${response.status} (${response.statusText || "unspecified"}). Please check your Vercel database environment variables.`;
    throw { error: parseErrorMessage(payload, fallbackMsg) };
  }

  const session = (payload as { data?: any } | null)?.data;
  if (!session?.accessToken || !session?.user) {
    throw { error: "Unexpected auth response from server." };
  }

  const userRole = normalizeFrontendRole(String(session.user.role ?? ""));
  const userName = String(session.user.fullName ?? session.user.name ?? "User");
  const userEmail = String(session.user.email ?? getResolvedIdentifier(data));
  const jobRole = resolveSessionJobRole(session.user);

  return {
    token: String(session.accessToken),
    refreshToken: typeof session.refreshToken === "string" ? session.refreshToken : undefined,
    user: {
      id: session.user.id ?? session.user.loginId ?? userEmail,
      name: userName,
      email: userEmail,
      role: userRole,
      jobRole,
      avatarInitials: String(session.user.avatarInitials ?? toInitials(userName)),
      reportingManagerId: session.user.reportingManagerId ?? null,
      employeeCode: session.user.employeeCode ?? null,
    },
  };
}

// ─── Query Key Factories ──────────────────────────────────────────────────────

export const getGetAdminDashboardSummaryQueryKey = () => ["adminDashboardSummary"] as const;
export const getGetRevenueChartQueryKey = () => ["revenueChart"] as const;
export const getGetComplaintStatsQueryKey = () => ["complaintStats"] as const;
export const getGetInstallationChartQueryKey = () => ["installationChart"] as const;
export const getGetRecentActivityQueryKey = () => ["recentActivity"] as const;
export const getListCustomersQueryKey = (params?: ListCustomersParams) => ["customers", params ?? {}] as const;
export const getGetCustomerQueryKey = (id: number) => ["customer", id] as const;
export const getGetSubadminServiceRequestStatsQueryKey = (customerId?: number) => ["subadminServiceRequestStats", customerId ?? "all"] as const;
export const getGetCustomerInverterGenerationQueryKey = (customerId: number) => ["customerInverterGeneration", customerId] as const;
export const getGetSubadminCustomerSummaryQueryKey = (customerId: number) => ["subadminCustomerSummary", customerId] as const;
export const getGetCustomerInverterGenerationHistoryQueryKey = (customerId: number, period: string) => ["customerInverterGenerationHistory", customerId, period] as const;
export const getListEmployeesQueryKey = (params?: ListEmployeesParams) => ["employees", params ?? {}] as const;
export const getGetEmployeeQueryKey = (id: number) => ["employee", id] as const;
export const getGetEmployeeByIdQueryKey = (userId: string) => ["employeeById", userId] as const;
export const getListPartnersQueryKey = () => ["partners"] as const;
export const getListComplaintsQueryKey = (_?: any) => ["complaints"] as const;
export const getListInventoryQueryKey = () => ["inventory"] as const;
export const getGetFinancialSummaryQueryKey = (params?: any) => ["financialSummary", params] as const;
export const getGetMonthlyPnLQueryKey = (params?: any) => ["monthlyPnL", params] as const;
export const getGetZoneBreakdownQueryKey = (params?: any) => ["zoneBreakdown", params] as const;
export const getListAmcContractsQueryKey = (params?: any) => ["amcContracts", params] as const;
export const getListPartnerPayoutsQueryKey = (params?: any) => ["partnerPayouts", params] as const;
export const getListInvoicesQueryKey = (params?: any) => ["invoices", params] as const;
export const getListTasksQueryKey = (params?: { employeeUserId?: string | number; status?: string }) => ["tasks", params ?? {}] as const;
export const getListCustomerServiceRequestsQueryKey = () => ["customerServiceRequests"] as const;

// ─── Hooks ────────────────────────────────────────────────────────────────────

const delay = <T,>(data: T, ms = 400): Promise<T> =>
  new Promise((res) => setTimeout(() => res(data), ms));

export function useGetAdminDashboardSummary(opts?: any) {
  return useQuery<AdminDashboardSummary>({
    queryKey: getGetAdminDashboardSummaryQueryKey(),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) throw { error: "Backend API missing" };

      const payload = await requestApi<any>("/admin/dashboard");

      // Map backend summary to frontend structure
      return {
        totalCustomers: payload.summary.totalCustomers || 0,
        activeInstallations: payload.summary.totalTasks || 0, // Fallback mapping
        pendingServices: payload.summary.pendingServices ?? 0,
        monthlyRevenue: payload.summary.monthlyRevenue || 0,
        openComplaints: payload.summary.openComplaints || 0,
        customersTrend: payload.summary.customersTrend || 0,
        revenueTrend: payload.summary.revenueTrend || 0,
      };
    },
    ...opts?.query,
  });
}

export function useGetRevenueChart(opts?: any) {
  return useQuery<RevenueChart>({
    queryKey: getGetRevenueChartQueryKey(),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) return [];

      try {
        return await requestApi<RevenueChart>("/admin/revenue-chart");
      } catch {
        return [];
      }
    },
    ...opts?.query
  });
}

function mapComplaintsToStats(complaints: any[]): ComplaintStats {
  const c = complaints ?? [];
  return {
    new: c.filter((x: any) => x.status === "pending").length,
    assigned: c.filter((x: any) => x.status === "scheduled").length,
    inProgress: c.filter((x: any) => x.status === "in_progress" || x.status === "assigned").length,
    resolved: c.filter((x: any) => x.status === "completed").length,
  };
}

export function useGetComplaintStats(opts?: any) {
  const role = useAuth.getState().user?.role;
  return useQuery<ComplaintStats>({
    queryKey: getGetComplaintStatsQueryKey(),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) return { new: 0, assigned: 0, inProgress: 0, resolved: 0 };

      const path =
        role === "super_admin"
          ? "/superadmin/complaints?limit=50&offset=0"
          : "/admin/complaints?limit=50&offset=0";

      try {
        const response = await requestApi<{ complaints: any[] }>(path);
        return mapComplaintsToStats(response.complaints);
      } catch (error) {
        console.warn("Failed to fetch complaint stats", error);
        return { new: 0, assigned: 0, inProgress: 0, resolved: 0 };
      }
    },
    ...opts?.query,
  });
}

export function useGetAdminComplaints(opts?: any) {
  return useQuery<any>({
    queryKey: ["adminComplaints"],
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        return { complaints: [], pagination: { total: 0, limit: 50, offset: 0 } };
      }
      try {
        return await requestApi<any>("/admin/complaints?limit=50&offset=0");
      } catch (error) {
        console.warn("Failed to fetch admin complaints", error);
        return { complaints: [], pagination: { total: 0, limit: 50, offset: 0 } };
      }
    },
    ...opts?.query,
  });
}

export function useGetSuperAdminComplaints(opts?: any) {
  return useQuery<any>({
    queryKey: ["superadminComplaints"],
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        return { complaints: [], pagination: { total: 0, limit: 50, offset: 0 } };
      }
      try {
        return await requestApi<any>("/superadmin/complaints?limit=50&offset=0");
      } catch (error) {
        console.warn("Failed to fetch superadmin complaints", error);
        return { complaints: [], pagination: { total: 0, limit: 50, offset: 0 } };
      }
    },
    ...opts?.query,
  });
}

export function useGetInstallationChart(opts?: any) {
  return useQuery<InstallationChart>({
    queryKey: getGetInstallationChartQueryKey(),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) return [];

      try {
        return await requestApi<InstallationChart>("/admin/installation-chart");
      } catch {
        return [];
      }
    },
    ...opts?.query
  });
}

export function useGetRecentActivity(opts?: any) {
  return useQuery<RecentActivityRecord[]>({
    queryKey: getGetRecentActivityQueryKey(),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        try {
          const tasks = await requestApi<any[]>("/tasks?limit=10");
          return tasks.map(t => ({
            id: t.id,
            type: (t.jobType || "service").toLowerCase(),
            description: t.description || "Task Update",
            customerName: t.customerName,
            assignedTo: "Technician",
            status: t.status,
            createdAt: t.updatedAt || t.completedAt || t.createdAt || new Date().toISOString()
          })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (e) {
          // ignore
        }
      }
      return [];
    },
    ...opts?.query
  });
}

export function useListCustomers(params?: ListCustomersParams, opts?: any) {
  return useQuery<CustomerRecord[]>({
    queryKey: getListCustomersQueryKey(params),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required for customer data." };
      }

      const response = await requestApi<unknown[]>(`/customers${buildCustomerQueryString(params)}`);
      return Array.isArray(response) ? response.map(normalizeCustomerRecord) : [];
    },
    ...opts?.query,
  });
}

export function useGetCustomer(id: number, opts?: any) {
  return useQuery<CustomerRecord | null>({
    queryKey: getGetCustomerQueryKey(id),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required for customer details." };
      }

      const response = await requestApi<unknown>(`/customers/${id}`);
      return normalizeCustomerRecord(response);
    },
    ...opts?.query,
  });
}

export function useGetSubadminCustomerSummary(customerId: number, opts?: any) {
  return useQuery<CustomerDashboardSummary>({
    queryKey: getGetSubadminCustomerSummaryQueryKey(customerId),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required for customer dashboard summary." };
      }

      const response = await requestApi<{ customer: unknown; serviceRequestStats: { total: number; pending: number; scheduled: number; completed: number } }>(
        `/subadmin/customers/${customerId}/summary`,
      );
      return {
        customer: normalizeCustomerRecord(response.customer),
        serviceRequestStats: response.serviceRequestStats,
      };
    },
    enabled: customerId > 0,
    ...opts?.query,
  });
}

export function useGetCustomerInverterGenerationHistory(customerId: number, period: string, opts?: any) {
  return useQuery<CustomerGenerationHistoryPoint[]>({
    queryKey: getGetCustomerInverterGenerationHistoryQueryKey(customerId, period),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required for inverter history." };
      }

      const response = await requestApi<{ period: string; history: CustomerGenerationHistoryPoint[]; dataUnavailable?: boolean; unavailableReason?: string }>(
        `/subadmin/customers/${customerId}/inverter-generation-history?period=${encodeURIComponent(period)}`,
      );

      // If backend signals data is unavailable (e.g. Growatt auth failed), surface a clear error
      if (response.dataUnavailable) {
        throw { error: response.unavailableReason || "Unable to fetch live generation history from the inverter portal." };
      }

      return response.history ?? [];
    },
    enabled: customerId > 0,
    ...opts?.query,
  });
}

export function useGetSubadminServiceRequestStats(customerId?: number, opts?: any) {
  return useQuery<{
    total: number;
    pending: number;
    scheduled: number;
    completed: number;
  }>({
    queryKey: getGetSubadminServiceRequestStatsQueryKey(customerId),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required for complaint stats." };
      }

      const path = customerId ? `/subadmin/service-requests/stats?customerId=${customerId}` : "/subadmin/service-requests/stats";
      return await requestApi<{
        total: number;
        pending: number;
        scheduled: number;
        completed: number;
      }>(path);
    },
    enabled: customerId === undefined || customerId > 0,
    ...opts?.query,
  });
}

export function useGetCustomerInverterGeneration(customerId: number, opts?: any) {
  return useQuery<CustomerGenerationSummary>({
    queryKey: getGetCustomerInverterGenerationQueryKey(customerId),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required for inverter data." };
      }

      const response = await requestApi<CustomerGenerationSummary & { dataUnavailable?: boolean; unavailableReason?: string }>(
        `/subadmin/customers/${customerId}/inverter-generation`
      );

      // If backend signals data is unavailable (e.g. Growatt auth failed), surface a clear error
      if (response.dataUnavailable) {
        throw { error: response.unavailableReason || "Unable to fetch live data from the inverter portal." };
      }

      return response;
    },
    enabled: customerId > 0,
    ...opts?.query,
  });
}

export function useCreateCustomer(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ data }: { data: CreateCustomerInput }) => {
      const payload = {
        ...data,
        installationDate: normalizeDateValue(data.installationDate) ?? new Date().toISOString(),
        warrantyExpiry: normalizeDateValue(data.warrantyExpiry ?? null),
        amcExpiryDate: normalizeDateValue(data.amcExpiryDate ?? null),
        amcStatus: data.amcStatus ?? "none",
        status: data.status ?? "active",
      };

      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required to create customers." };
      }

      const response = await requestApi<unknown>("/customers", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return normalizeCustomerRecord(response);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["amc-customers"] });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useUpdateCustomer(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCustomerInput }) => {
      const payload: Record<string, unknown> = { ...data };

      if (data.installationDate !== undefined) {
        payload.installationDate = normalizeDateValue(data.installationDate) ?? new Date().toISOString();
      }
      if (data.warrantyExpiry !== undefined) {
        payload.warrantyExpiry = normalizeDateValue(data.warrantyExpiry ?? null);
      }
      if (data.amcExpiryDate !== undefined) {
        payload.amcExpiryDate = normalizeDateValue(data.amcExpiryDate ?? null);
      }

      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required to update customers." };
      }

      const response = await requestApi<unknown>(`/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return normalizeCustomerRecord(response);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["amc-customers"] });
      queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(variables.id) });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useUpdateSubadminCustomerCredentials(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<{ inverterBrand: string; inverterLoginId: string; inverterPassword: string; inverterApiKey: string; inverterDeviceSn: string; city: string; address: string; projectStage: number }> }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required to update customer credentials." };
      }

      const response = await requestApi<unknown>(`/subadmin/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      const responseData = response as { customer: unknown };
      return responseData.customer ? normalizeCustomerRecord(responseData.customer) : null;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(variables.id) });
      queryClient.invalidateQueries({ queryKey: getGetSubadminCustomerSummaryQueryKey(variables.id) });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useDeleteCustomer(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required to delete customers." };
      }

      return requestApi<{ success: boolean }>(`/customers/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.removeQueries({ queryKey: getGetCustomerQueryKey(variables.id) });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useListEmployees(params?: ListEmployeesParams, opts?: any) {
  return useQuery<EmployeeRecord[]>({
    queryKey: getListEmployeesQueryKey(params),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required for employee data." };
      }

      const response = await requestApi<InternalUserRecord[]>(`/users/internal${buildEmployeesQueryString(params)}`);
      return Array.isArray(response) ? response.map(normalizeEmployeeRecord) : [];
    },
    ...opts?.query,
  });
}

export function useGetEmployee(id: number, opts?: any) {
  return useQuery<EmployeeRecord | null>({
    queryKey: getGetEmployeeQueryKey(id),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required for employee details." };
      }

      const response = await requestApi<InternalUserRecord[]>("/users/internal?role=EMPLOYEE&limit=200");
      const employee = (Array.isArray(response) ? response.map(normalizeEmployeeRecord) : []).find((entry) => entry.id === id) ?? null;
      return employee;
    },
    ...opts?.query,
  });
}

export function useGetEmployeeById(userId: string, opts?: any) {
  return useQuery<EmployeeRecord | null>({
    queryKey: getGetEmployeeByIdQueryKey(userId),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required for employee details." };
      }

      try {
        const response = await requestApi<InternalUserRecord>(`/users/internal/${userId}`);
        return response ? normalizeEmployeeRecord(response) : null;
      } catch (error) {
        console.error(`Failed to fetch employee ${userId}:`, error);
        throw error;
      }
    },
    ...opts?.query,
  });
}

export type CreateEmployeeInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  zone: string;
  status: "active" | "inactive" | "on_leave";
  joiningDate: string;
  services: string[];
};

export function useCreateEmployee(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ data }: { data: CreateEmployeeInput }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required to create employees." };
      }

      const response = await requestApi<InternalUserRecord>("/users/internal", {
        method: "POST",
        body: JSON.stringify({
          fullName: data.name,
          email: data.email,
          phoneNumber: data.phone,
          password: data.password,
          role: "EMPLOYEE",
          jobRole: data.role,
          zone: data.zone,
          serviceCategories: data.services,
        }),
      });

      const normalized = normalizeEmployeeRecord(response);
      if (normalized.userId) {
        setEmployeeServices(normalized.userId, data.services);
      }
      return normalized;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      notifyEmployeeDataChanged();
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useListCustomerServiceRequests(opts?: any) {
  return useQuery<any[]>({
    queryKey: getListCustomerServiceRequestsQueryKey(),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        try {
          const response = await requestApi<{ requests: any[] }>("/customer/requests");
          return response?.requests ?? [];
        } catch (error) {
          console.warn("Failed to fetch service requests from backend, using local storage fallback", error);
          const rows = getStoredCustomerServiceRequests();
          return delay(rows, 80);
        }
      }
      const rows = getStoredCustomerServiceRequests();
      return delay(rows, 80);
    },
    ...opts?.query,
  });
}


export function useCreateCustomerServiceRequest(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ data }: { data: any }) => {
      const apiBaseUrl = getApiBaseUrl();
      const authUser = useAuth.getState().user;
      
      const newLocalId = `local-${Date.now()}`;
      const newLocalRecord: any = {
        id: newLocalId,
        ticketId: `TIC-${Math.floor(100000 + Math.random() * 900000)}`,
        type: data.serviceType,
        title: data.serviceType,
        description: data.description,
        status: "pending",
        address: data.address,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        date: data.preferredDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      try {
        const localRequests = getStoredCustomerServiceRequests();
        setStoredCustomerServiceRequests([newLocalRecord, ...localRequests]);
        
        const localComplaints = getStoredDynamicComplaints();
        const newLocalComplaint: any = {
          id: newLocalId,
          customerId: authUser?.id ? Number(authUser.id) : 1,
          customer_id: authUser?.id ? Number(authUser.id) : 1,
          customerName: authUser?.name || "Customer Portal",
          customerEmail: authUser?.email || "customer@example.com",
          customerPhone: authUser?.employeeCode || "",
          customerCity: data.address.split(",")[0] || "Mumbai",
          customerCode: "CUST-LOCAL",
          title: data.serviceType,
          description: data.description,
          status: "pending",
          scheduledDate: null,
          scheduled_date: null,
          scheduledTime: null,
          address: data.address,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          createdAt: newLocalRecord.createdAt,
        };
        setStoredDynamicComplaints([newLocalComplaint, ...localComplaints]);
      } catch (e) {
        console.warn("Failed to write to local storage", e);
      }

      if (!apiBaseUrl) {
        return { data: newLocalRecord, success: true, message: "Service request submitted locally" };
      }

      try {
        return await requestApi<any>("/customer/requests", {
          method: "POST",
          body: JSON.stringify(data),
        });
      } catch (error) {
        console.warn("Failed to submit service request to backend, returning local success", error);
        return { data: newLocalRecord, success: true, message: "Service request submitted locally" };
      }
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: getListCustomerServiceRequestsQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useCreateInternalUser(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ data }: { data: CreateInternalUserInput }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required to create internal users." };
      }

      return requestApi<InternalUserRecord>("/users/internal", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      notifyEmployeeDataChanged();
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useUpdateInternalUser(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateInternalUserInput }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required to update internal users." };
      }

      return requestApi<InternalUserRecord>(`/users/internal/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      notifyEmployeeDataChanged();
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useTransferInternalUserTeam(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: TransferInternalUserTeamInput }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required to transfer team hierarchy." };
      }

      return requestApi<InternalUserRecord>(`/users/internal/${userId}/transfer-team`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      notifyEmployeeDataChanged();
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useDeleteInternalUser(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required to delete internal users." };
      }

      return requestApi<{ success: boolean }>(`/users/internal/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      notifyEmployeeDataChanged();
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useRegisterCustomer(opts?: any) {
  return useMutation({
    mutationFn: async ({ data }: { data: { fullName: string; email: string; phoneNumber?: string; password: string } }) => {
      const apiBaseUrl = getAuthApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend auth API is required for customer registration." };
      }

      const payload = await fetch(buildApiUrl(apiBaseUrl, "/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          role: "CUSTOMER",
        }),
      }).then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          throw { error: parseErrorMessage(body, "Unable to register customer") };
        }
        return body;
      }).catch((error: unknown) => {
        if (error && typeof error === "object" && "error" in (error as Record<string, unknown>)) {
          throw error;
        }
        throw { error: "Unable to reach auth server. Check backend URL or network connection." };
      });

      const session = (payload as { data?: any } | null)?.data;
      if (!session?.accessToken || !session?.user) {
        throw { error: "Unexpected auth response from server." };
      }

      const userRole = normalizeFrontendRole(String(session.user.role ?? ""));
      const userName = String(session.user.fullName ?? session.user.name ?? "User");
      return {
        token: String(session.accessToken),
        refreshToken: typeof session.refreshToken === "string" ? session.refreshToken : undefined,
        user: {
          id: session.user.id ?? session.user.loginId ?? session.user.email,
          name: userName,
          email: String(session.user.email ?? ""),
          role: userRole,
          avatarInitials: String(session.user.avatarInitials ?? toInitials(userName)),
        },
      } as AuthSession;
    },
    ...opts?.mutation,
  });
}

export function useListPartners(opts?: any) {
  return useQuery<PartnerRecord[]>({
    queryKey: getListPartnersQueryKey(),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required for partner data." };
      }

      const response = await requestApi<InternalUserRecord[]>("/users/internal?role=PARTNER&limit=200");
      return Array.isArray(response) ? response.map(normalizePartnerRecord) : [];
    },
    ...opts?.query,
  });
}

export function useCreatePartner(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ data }: { data: CreatePartnerInput }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required to create partners." };
      }

      const response = await requestApi<InternalUserRecord>("/users/internal", {
        method: "POST",
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          password: data.password,
          role: "PARTNER",
          businessName: data.companyName,
          zone: data.zone,
        }),
      });

      return normalizePartnerRecord({
        ...response,
        partnerProfile: {
          serviceZone: data.zone,
          businessName: data.companyName,
        },
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: getListPartnersQueryKey() });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useListComplaints(params?: any, opts?: any) {
  return useQuery<ComplaintRecord[]>({
    queryKey: getListComplaintsQueryKey(params),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required for complaints data." };
      }

      // Check user role to determine the endpoint
      // Super admin uses /superadmin/complaints
      // Admin uses /admin/complaints (if it exists, otherwise we use subadmin/superadmin)
      // For now, let's use the superadmin endpoint if the user has that role, 
      // otherwise fallback to a generic one or subadmin.

      const response = await requestApi<{ complaints: any[] }>(`/superadmin/complaints`, {
        method: "GET",
      });

      const complaints = Array.isArray(response?.complaints) ? response.complaints : [];
      return complaints.map((c: any) => ({
        id: Number(c.id),
        ticketId: c.ticketId,
        type: c.type,
        description: c.description,
        customerName: c.customerName,
        customerPhone: c.customerPhone,
        customerCity: c.customerCity,
        customerId: c.customerId,
        priority: c.priority,
        status: c.status,
        slaDeadline: c.slaDeadline,
        createdAt: c.createdAt,
        resolvedAt: c.resolvedAt,
        zone: c.customerCity, // Mapping city to zone for UI
      }));
    },
    ...opts?.query,
  });
}

export function useListInventory(opts?: any) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleInventoryChange = () => {
      queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
    };

    window.addEventListener("storage", handleInventoryChange);
    window.addEventListener(INVENTORY_CHANGED_EVENT, handleInventoryChange);

    return () => {
      window.removeEventListener("storage", handleInventoryChange);
      window.removeEventListener(INVENTORY_CHANGED_EVENT, handleInventoryChange);
    };
  }, [queryClient]);

  return useQuery<InventoryRecord[]>({
    queryKey: getListInventoryQueryKey(),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<InventoryRecord[]>("/inventory");
      }
      return delay(getStoredInventoryRecords(), 120);
    },
    initialData: getApiBaseUrl() ? undefined : getStoredInventoryRecords(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15000,
    ...opts?.query,
  });
}

export function useCreateInventory(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ data }: { data: { sku: string; name: string; category: string; inStock: number; minThreshold: number; supplier: string } }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<InventoryRecord>("/inventory", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
      const records = getStoredInventoryRecords();
      const nextId = records.reduce((max, current) => Math.max(max, Number(current.id) || 0), 0) + 1;
      const inStock = Number.isFinite(data.inStock) ? Math.max(0, data.inStock) : 0;
      const minThreshold = Number.isFinite(data.minThreshold) ? Math.max(0, data.minThreshold) : 0;

      const created: InventoryRecord = {
        id: nextId,
        sku: data.sku,
        name: data.name,
        category: data.category,
        inStock,
        minThreshold,
        supplier: data.supplier,
        isLowStock: inStock <= minThreshold,
        pricePerUnit: 0,
        entryDate: new Date().toISOString(),
      };

      setStoredInventoryRecords([created, ...records]);
      queryClient.setQueryData(getListInventoryQueryKey(), [created, ...records]);
      notifyInventoryChanged();
      return delay(created, 200);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useUpdateInventory(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: Partial<InventoryRecord> }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<InventoryRecord>(`/inventory/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      }
      const records = getStoredInventoryRecords();
      const idx = records.findIndex(i => String(i.id) === String(id));
      if (idx !== -1) {
        const updated = normalizeInventoryRecord({ ...records[idx], ...data, id: records[idx].id });
        records[idx] = updated;
        setStoredInventoryRecords(records);
        queryClient.setQueryData(getListInventoryQueryKey(), records);
        notifyInventoryChanged();
        return delay(updated, 200);
      }
      throw new Error("Item not found");
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useDeleteInventory(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ id }: { id: number | string }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<{ success: boolean }>(`/inventory/${id}`, {
          method: "DELETE",
        });
      }
      const records = getStoredInventoryRecords();
      const idx = records.findIndex(i => String(i.id) === String(id));
      if (idx !== -1) {
        records.splice(idx, 1);
        setStoredInventoryRecords(records);
        queryClient.setQueryData(getListInventoryQueryKey(), records);
        notifyInventoryChanged();
      }
      return delay({ success: true }, 200);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

// --- Dispatched Materials Helpers ---

function getStoredDispatchRecords(): DispatchedMaterialRecord[] {
  try {
    const stored = localStorage.getItem(DISPATCHED_MATERIALS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredDispatchRecords(items: DispatchedMaterialRecord[]): void {
  localStorage.setItem(DISPATCHED_MATERIALS_STORAGE_KEY, JSON.stringify(items));
}

function notifyDispatchChanged(): void {
  window.dispatchEvent(new Event(DISPATCH_CHANGED_EVENT));
}

// --- Dispatched Materials Hooks ---

export function useListDispatchedMaterials(customerId?: number, opts?: any) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const handleDispatchChange = () => {
      queryClient.invalidateQueries({ queryKey: ["dispatched-materials", customerId] });
    };
    window.addEventListener(DISPATCH_CHANGED_EVENT, handleDispatchChange);
    return () => window.removeEventListener(DISPATCH_CHANGED_EVENT, handleDispatchChange);
  }, [queryClient, customerId]);

  return useQuery<DispatchedMaterialRecord[]>({
    queryKey: ["dispatched-materials", customerId],
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        const all = await requestApi<DispatchedMaterialRecord[]>("/inventory/dispatches/all");
        if (customerId) return all.filter(r => r.customerId === customerId);
        return all;
      }
      const all = getStoredDispatchRecords();
      if (customerId) return all.filter(r => r.customerId === customerId);
      return all;
    },
    initialData: getApiBaseUrl() ? undefined : [],
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    ...opts?.query
  });
}

export function useCreateDispatchRecord(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ data }: { data: Omit<DispatchedMaterialRecord, "id" | "dispatchedAt"> & { dispatchedAt?: string } }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<DispatchedMaterialRecord>("/inventory/dispatches", {
          method: "POST",
          body: JSON.stringify({
            customerId: Number(data.customerId),
            itemId: Number(data.itemId),
            quantity: Number(data.quantity),
            notes: data.notes,
            dispatchedAt: data.dispatchedAt,
          }),
        });
      }
      const records = getStoredDispatchRecords();
      const inventory = getStoredInventoryRecords();
      const item = inventory.find(i => String(i.id) === String(data.itemId));
      const created: DispatchedMaterialRecord = {
        ...data,
        id: `DISP-${Date.now()}`,
        dispatchedAt: data.dispatchedAt || new Date().toISOString(),
        pricePerUnit: item ? item.pricePerUnit : 0,
      };
      setStoredDispatchRecords([created, ...records]);
      notifyDispatchChanged();

      // Automatically reduce inventory stock when material is dispatched to a customer
      const itemIdx = inventory.findIndex(i => String(i.id) === String(data.itemId));
      if (itemIdx !== -1) {
        inventory[itemIdx].inStock = Math.max(0, inventory[itemIdx].inStock - data.quantity);
        inventory[itemIdx].isLowStock = inventory[itemIdx].inStock <= inventory[itemIdx].minThreshold;
        setStoredInventoryRecords(inventory);
        notifyInventoryChanged();
      }

      return delay(created, 200);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["dispatched-materials"] });
      queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useUpdateDispatchRecord(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<DispatchedMaterialRecord> }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<DispatchedMaterialRecord>(`/inventory/dispatches/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            quantity: data.quantity !== undefined ? Number(data.quantity) : undefined,
            notes: data.notes,
          }),
        });
      }
      const records = getStoredDispatchRecords();
      const idx = records.findIndex(r => r.id === id);
      if (idx === -1) throw new Error("Dispatch record not found");

      const oldRecord = records[idx];
      const updated = { ...oldRecord, ...data };
      records[idx] = updated;
      setStoredDispatchRecords(records);
      notifyDispatchChanged();

      // Adjust inventory
      if (data.quantity !== undefined && data.quantity !== oldRecord.quantity) {
        const inventory = getStoredInventoryRecords();
        const itemIdx = inventory.findIndex(i => String(i.id) === String(updated.itemId));
        if (itemIdx !== -1) {
          const diff = data.quantity - oldRecord.quantity;
          inventory[itemIdx].inStock = Math.max(0, inventory[itemIdx].inStock - diff);
          inventory[itemIdx].isLowStock = inventory[itemIdx].inStock <= inventory[itemIdx].minThreshold;
          setStoredInventoryRecords(inventory);
          notifyInventoryChanged();
        }
      }

      return delay(updated, 200);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["dispatched-materials"] });
      queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useDeleteDispatchRecord(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<{ success: boolean }>(`/inventory/dispatches/${id}`, {
          method: "DELETE",
        });
      }
      const records = getStoredDispatchRecords();
      const idx = records.findIndex(r => r.id === id);
      if (idx === -1) throw new Error("Dispatch record not found");

      const deletedRecord = records[idx];
      records.splice(idx, 1);
      setStoredDispatchRecords(records);
      notifyDispatchChanged();

      // Return stock to inventory
      const inventory = getStoredInventoryRecords();
      const itemIdx = inventory.findIndex(i => String(i.id) === String(deletedRecord.itemId));
      if (itemIdx !== -1) {
        inventory[itemIdx].inStock += deletedRecord.quantity;
        inventory[itemIdx].isLowStock = inventory[itemIdx].inStock <= inventory[itemIdx].minThreshold;
        setStoredInventoryRecords(inventory);
        notifyInventoryChanged();
      }

      return delay({ success: true }, 200);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["dispatched-materials"] });
      queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useGetFinancialSummary(params?: any, opts?: any) {
  return useQuery<FinancialSummary>({
    queryKey: getGetFinancialSummaryQueryKey(params),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        const qs = new URLSearchParams();
        if (params?.from) qs.set("from", params.from);
        if (params?.to) qs.set("to", params.to);
        const q = qs.toString();
        return requestApi<FinancialSummary>(`/financials/summary${q ? `?${q}` : ""}`);
      }
      return delay(mockFinancialSummary);
    },
    ...opts?.query
  });
}

export function useGetMonthlyPnL(params?: any, opts?: any) {
  return useQuery<any[]>({
    queryKey: getGetMonthlyPnLQueryKey(params),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        const qs = new URLSearchParams();
        if (params?.from) qs.set("from", params.from);
        if (params?.to) qs.set("to", params.to);
        const q = qs.toString();
        return requestApi<any[]>(`/financials/pnl${q ? `?${q}` : ""}`);
      }
      return delay([]);
    },
    ...opts?.query
  });
}

export function useGetZoneBreakdown(params?: any, opts?: any) {
  return useQuery<any[]>({
    queryKey: getGetZoneBreakdownQueryKey(params),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        const qs = new URLSearchParams();
        if (params?.from) qs.set("from", params.from);
        if (params?.to) qs.set("to", params.to);
        const q = qs.toString();
        return requestApi<any[]>(`/financials/zones${q ? `?${q}` : ""}`);
      }
      return delay([]);
    },
    ...opts?.query
  });
}

export function useListAmcContracts(params?: any, opts?: any) {
  return useQuery<any[]>({
    queryKey: getListAmcContractsQueryKey(params),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        const qs = new URLSearchParams();
        if (params?.from) qs.set("from", params.from);
        if (params?.to) qs.set("to", params.to);
        const q = qs.toString();
        return requestApi<any[]>(`/financials/amc${q ? `?${q}` : ""}`);
      }
      return delay([]);
    },
    ...opts?.query
  });
}

export function useListPartnerPayouts(params?: any, opts?: any) {
  return useQuery<any[]>({
    queryKey: getListPartnerPayoutsQueryKey(params),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        const qs = new URLSearchParams();
        if (params?.from) qs.set("from", params.from);
        if (params?.to) qs.set("to", params.to);
        const q = qs.toString();
        return requestApi<any[]>(`/financials/payouts${q ? `?${q}` : ""}`);
      }
      return delay([]);
    },
    ...opts?.query
  });
}

export function useListInvoices(customerId?: string | number, opts?: any) {
  const params = opts?.query;
  return useQuery<InvoiceRecord[]>({
    queryKey: getListInvoicesQueryKey({ customerId, ...params }),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        const qs = new URLSearchParams();
        if (customerId) qs.set("customerId", String(customerId));
        if (params?.invoiceType) qs.set("invoiceType", params.invoiceType);
        if (params?.from) qs.set("from", params.from);
        if (params?.to) qs.set("to", params.to);
        const q = qs.toString();
        const response = await requestApi<any[]>(`/invoices${q ? `?${q}` : ""}`);
        const invoices = Array.isArray(response) ? response : [];
        return invoices.map(inv => {
          const rawDate = inv.date || inv.createdAt;
          return {
            ...inv,
            customer: typeof inv.customer === 'object' ? inv.customer?.fullName : (inv.customer ?? `Customer #${inv.customerId}`),
            date: (rawDate && !isNaN(new Date(rawDate).getTime())) ? format(new Date(rawDate), "dd MMM yyyy") : "N/A",
          };
        }) as InvoiceRecord[];
      }
      let all = getStoredInvoices();
      if (customerId) all = all.filter(i => String(i.customerId) === String(customerId));
      if (params?.invoiceType) all = all.filter((i: any) => i.invoiceType === params.invoiceType);
      return all;
    },
    ...opts?.query
  });
}

export function useListTasks(params?: { employeeUserId?: string | number; status?: string }, opts?: any) {
  return useQuery<TaskRecord[]>({
    queryKey: getListTasksQueryKey(params),
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        const query = new URLSearchParams();
        if (params?.employeeUserId !== undefined) query.set("employeeUserId", String(params.employeeUserId));
        if (params?.status) query.set("status", String(params.status).toUpperCase());
        query.set("limit", "300");
        const serialized = query.toString();
        return requestApi<TaskRecord[]>(`/tasks${serialized.length > 0 ? `?${serialized}` : ""}`);
      }

      let rows = [...mockTasks] as TaskRecord[];
      if (params?.employeeUserId !== undefined) {
        rows = rows.filter((task) => String(task.employeeUserId ?? task.employeeId ?? "") === String(params.employeeUserId));
      }
      if (params?.status) {
        rows = rows.filter((task) => String(task.status).toLowerCase() === String(params.status).toLowerCase());
      }
      return delay(rows, 120);
    },
    ...opts?.query,
  });
}

export function useCreateTaskAssignment(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ data }: { data: CreateTaskAssignmentInput }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<TaskRecord>("/tasks", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }

      const nextId = mockTasks.reduce((max, current) => Math.max(max, Number(current.id) || 0), 0) + 1;
      // Support mock creation for either single assignee or multiple assignees.
      const createdItems: TaskRecord[] = [];
      const assignees = data.employeeUserIds && data.employeeUserIds.length > 0
        ? data.employeeUserIds
        : data.employeeUserId ? [data.employeeUserId] : [];

      if (assignees.length === 0) {
        // fallback: create a single unassigned task
        const created: TaskRecord = {
          id: nextId,
          jobType: data.jobType,
          description: data.description,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          address: data.address,
          status: "assigned",
          scheduledTime: data.scheduledTime,
          employeeUserId: undefined,
          completionMessage: null,
          completionDocumentUrl: null,
        };
        (mockTasks as TaskRecord[]).unshift(created);
        return delay(created, 120);
      }

      let idCounter = nextId;
      for (const userId of assignees) {
        const created: TaskRecord = {
          id: idCounter++,
          jobType: data.jobType,
          description: data.description,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          address: data.address,
          status: "assigned",
          scheduledTime: data.scheduledTime,
          employeeUserId: userId,
          completionMessage: null,
          completionDocumentUrl: null,
        };
        (mockTasks as TaskRecord[]).unshift(created);
        createdItems.push(created);
      }
      // If only one created, return single item to keep previous contract. Otherwise return array.
      return delay(createdItems.length === 1 ? createdItems[0] : (createdItems as any), 120);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useCreateBulkTaskAssignment(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ data }: { data: CreateBulkTaskAssignmentInput }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<TaskRecord[]>("/tasks/bulk", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }

      const results: TaskRecord[] = [];
      for (const empId of data.employeeUserIds) {
        const nextId = mockTasks.reduce((max, current) => Math.max(max, Number(current.id) || 0), 0) + 1;
        const created: TaskRecord = {
          id: nextId,
          jobType: data.jobType,
          description: data.description,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          address: data.address,
          status: "assigned",
          scheduledTime: data.scheduledTime,
          employeeUserId: empId,
          completionMessage: null,
          completionDocumentUrl: null,
          taskRate: data.taskRate ?? null,
        };
        (mockTasks as TaskRecord[]).unshift(created);
        results.push(created);
      }
      return delay(results, 120);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useCompleteTask(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string | number; data: CompleteTaskInput }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<TaskRecord>(`/tasks/${taskId}/complete`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      }

      const task = (mockTasks as TaskRecord[]).find((item) => String(item.id) === String(taskId));
      if (!task) {
        throw { error: "Task not found" };
      }
      task.status = "completed";
      task.completionMessage = data.message;
      task.completionDocumentUrl = data.documentUrl ?? null;
      task.beforeImageUrl = data.beforeImageUrl ?? null;
      task.afterImageUrl = data.afterImageUrl ?? null;
      task.beforeLatitude = data.beforeLatitude ?? null;
      task.beforeLongitude = data.beforeLongitude ?? null;
      task.afterLatitude = data.afterLatitude ?? null;
      task.afterLongitude = data.afterLongitude ?? null;
      return delay(task, 120);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useRateTaskAssignment(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string | number; data: RateTaskInput }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<TaskRecord>(`/tasks/${taskId}/rate`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      }

      const task = (mockTasks as TaskRecord[]).find((item) => String(item.id) === String(taskId));
      if (!task) {
        throw { error: "Task not found" };
      }
      task.customerRating = data.customerRating;
      task.customerFeedback = data.customerFeedback ?? null;
      task.fixCharges = data.fixCharges ?? null;
      return delay(task, 120);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useSaveWorkDescription(opts?: any) {
  return useMutation({
    mutationFn: async ({ data }: { data: { employeeId: number | string; description: string; timestamp: string } }) => {
      mockWorkDescriptions.unshift(data);
      return delay({ success: true }, 200);
    },
    ...opts?.mutation,
  });
}


export function useLogin(opts?: any) {
  return useMutation({
    mutationFn: async ({ data }: { data: LoginInput }) => {
      const identifier = getResolvedIdentifier(data);
      if (!identifier) {
        throw { error: "Email or login ID is required." };
      }

      await delay(null, 350);

      const apiBaseUrl = getAuthApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend auth API is not configured. Set VITE_AUTH_API_BASE_URL or VITE_API_BASE_URL." };
      }

      return loginViaBackend(data, apiBaseUrl);
    },
    ...opts?.mutation,
  });
}

export function useGetCustomerInstallationData(opts?: any) {
  return useQuery<CustomerRecord>({
    queryKey: ["customerInstallationData"],
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        const response = await requestApi<unknown>("/customer/installation");
        return normalizeCustomerRecord(response);
      }
      throw { error: "Backend not connected" };
    },
    ...opts?.query,
  });
}

export function useGetCustomerDispatches(opts?: any) {
  return useQuery<DispatchedMaterialRecord[]>({
    queryKey: ["customer-dispatches"],
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<DispatchedMaterialRecord[]>("/customer/dispatches");
      }
      const authUser = useAuth.getState().user;
      if (!authUser) return [];

      const all = getStoredDispatchRecords();
      return all.filter(r => r.customerName.toLowerCase() === authUser.name.toLowerCase());
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    initialData: getApiBaseUrl() ? undefined : [],
    ...opts?.query
  });
}



export function useCreateInvoice(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ data, proof }: { data: CreateInvoiceInput; proof?: File }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
        if (proof) {
          formData.append("proof", proof);
        }

        const headers = getAuthHeaders();
        // Don't set Content-Type for FormData, let the browser do it with boundary

        const response = await fetch(buildApiUrl(apiBaseUrl, "/invoices"), {
          method: "POST",
          headers,
          body: formData,
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw { error: parseErrorMessage(payload, "Failed to create invoice") };
        }
        return payload.data;
      }

      const currentInvoices = getStoredInvoices();
      const nextNum = currentInvoices.length + 1;
      const created: InvoiceRecord = {
        id: `INV-${new Date().getFullYear()}-${String(nextNum).padStart(3, "0")}`,
        ...data,
        proofUrl: proof ? URL.createObjectURL(proof) : null,
      };
      currentInvoices.push(created);
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(currentInvoices));
      return delay(created, 200);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useUpdateInvoice(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInvoiceInput }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<InvoiceRecord>(`/invoices/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      }

      const currentInvoices = getStoredInvoices();
      const index = currentInvoices.findIndex((inv) => inv.id === id);
      if (index === -1) throw { error: "Invoice not found" };
      currentInvoices[index] = { ...currentInvoices[index], ...data };
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(currentInvoices));
      return delay(currentInvoices[index], 200);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useDeleteInvoice(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<{ success: true }>(`/invoices/${id}`, {
          method: "DELETE",
        });
      }

      let currentInvoices = getStoredInvoices();
      currentInvoices = currentInvoices.filter((inv) => inv.id !== id);
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(currentInvoices));
      return delay({ success: true }, 200);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

// --- AMC Management Hooks --------------------------------------------------

export function useListAmcVisits(params?: { from?: string; to?: string; customerId?: number }, opts?: any) {
  return useQuery<AmcVisitRecord[]>({
    queryKey: ["amc-visits", params],
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        const qs = new URLSearchParams();
        if (params?.from) qs.set("from", params.from);
        if (params?.to) qs.set("to", params.to);
        if (params?.customerId) qs.set("customerId", String(params.customerId));
        return requestApi<AmcVisitRecord[]>(`/subadmin/amc-visits?${qs.toString()}`);
      }
      return [] as AmcVisitRecord[];
    },
    ...opts?.query
  });
}

export function useMarkVisitDone(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ id, notes, beforeImageUrl, afterImageUrl }: { id: string; notes?: string; beforeImageUrl?: string; afterImageUrl?: string }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<AmcVisitRecord>(`/subadmin/amc-visits/${id}/complete`, {
          method: "POST",
          body: JSON.stringify({ notes, beforeImageUrl, afterImageUrl }),
        });
      }
      throw new Error("Backend not connected");
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["amc-visits"] });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useUpdateAmcVisit(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; scheduledDate?: string; scheduledTime?: string; assignedEmployeeId?: string | null; beforeImageUrl?: string; afterImageUrl?: string; notes?: string; visitNotes?: string }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<AmcVisitRecord>(`/subadmin/amc-visits/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      }
      throw new Error("Backend not connected");
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["amc-visits"] });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useUpdateAmcSettings(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ customerId, data }: { customerId: number; data: any }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<CustomerRecord>(`/subadmin/customers/${customerId}/amc-settings`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      }
      throw new Error("Backend not connected");
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["amc-customers"] });
      queryClient.invalidateQueries({ queryKey: ["amc-visits"] });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export function useUpdateApartmentAmcSettings(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ apartmentId, data }: { apartmentId: number; data: any }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl) {
        return requestApi<any>(`/subadmin/apartments/${apartmentId}/amc-settings`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      }
      throw new Error("Backend not connected");
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["amc-customers"] });
      queryClient.invalidateQueries({ queryKey: ["amc-visits"] });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

// --- Service Requests (Complaints) Hook for Calendar ----------------------

export type ServiceRequestRecord = {
  id: number;
  customerName: string;
  customerCity?: string;
  customerCode?: string;
  title: string;
  description: string;
  status: string;
  scheduledDate: string | null;
  scheduled_date: string | null;
  scheduledTime: string | null;
  address?: string;
  createdAt: string;
};

export function useListServiceRequests(opts?: any) {
  return useQuery<ServiceRequestRecord[]>({
    queryKey: ["service-requests"],
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        const rows = getStoredDynamicComplaints();
        return rows.map((c: any) => ({
          id: Number(c.id) || Date.now(),
          customerName: c.customerName ?? "",
          customerCity: c.customerCity ?? "",
          customerCode: c.customerCode ?? "",
          title: c.title ?? "Complaint",
          description: c.description ?? "",
          status: c.status ?? "pending",
          scheduledDate: c.scheduledDate ?? c.scheduled_date ?? null,
          scheduled_date: c.scheduled_date ?? c.scheduledDate ?? null,
          scheduledTime: c.scheduledTime ?? c.scheduled_time ?? null,
          address: c.address ?? "",
          createdAt: c.createdAt ?? new Date().toISOString(),
        }));
      }
      try {
        const payload = await requestApi<any>("/subadmin/service-requests");
        const rows: any[] = Array.isArray(payload)
          ? payload
          : payload?.requests ?? [];
        return rows.map((c: any) => ({
          id: Number(c.id),
          customerName: c.customerName ?? c.customer_name ?? "",
          customerCity: c.customerCity ?? c.customer_city ?? "",
          customerCode: c.customerCode ?? c.customer_code ?? "",
          title: c.title ?? c.description ?? "Complaint",
          description: c.description ?? "",
          status: c.status ?? "pending",
          scheduledDate: c.scheduledDate ?? c.scheduled_date ?? null,
          scheduled_date: c.scheduled_date ?? c.scheduledDate ?? null,
          scheduledTime: c.scheduledTime ?? c.scheduled_time ?? null,
          address: c.address ?? c.customerCity ?? "",
          createdAt: c.createdAt ?? c.created_at ?? new Date().toISOString(),
        }));
      } catch (e) {
        console.error("[useListServiceRequests] failed:", e);
        const rows = getStoredDynamicComplaints();
        return rows.map((c: any) => ({
          id: Number(c.id) || Date.now(),
          customerName: c.customerName ?? "",
          customerCity: c.customerCity ?? "",
          customerCode: c.customerCode ?? "",
          title: c.title ?? "Complaint",
          description: c.description ?? "",
          status: c.status ?? "pending",
          scheduledDate: c.scheduledDate ?? c.scheduled_date ?? null,
          scheduled_date: c.scheduled_date ?? c.scheduledDate ?? null,
          scheduledTime: c.scheduledTime ?? c.scheduled_time ?? null,
          address: c.address ?? "",
          createdAt: c.createdAt ?? new Date().toISOString(),
        }));
      }
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0,
    ...opts?.query,
  });
}

// --- Messages ---
export function useListConversations(opts?: any) {
  return useQuery<{ id: string, fullName: string, role: string, lastMessage?: string, lastMessageAt?: string, unreadCount: number }[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      // requestApi auto-unwraps { data: { conversations: [...] } } → { conversations: [...] }
      const response = await requestApi<any>("/messages/conversations");
      return response?.conversations || [];
    },
    refetchInterval: 5000,
    ...opts?.query,
  });
}

export function useListMessages(partnerId?: string, opts?: any) {
  return useQuery<any[]>({
    queryKey: ["messages", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      // requestApi auto-unwraps { data: { messages: [...] } } → { messages: [...] }
      const response = await requestApi<any>(`/messages/${partnerId}`);
      return response?.messages || [];
    },
    enabled: !!partnerId,
    refetchInterval: 3000,
    ...opts?.query,
  });
}

export function useSendMessage(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, onError, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async (data: { receiverId?: string, content: string }) => {
      if (!data.content || data.content.trim().length === 0) {
        throw { error: "Message content cannot be empty" };
      }
      // requestApi auto-unwraps { data: { message: {...} } } → { message: {...} }
      return requestApi<any>("/messages", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (result, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onSuccess?.(result, variables, context);
    },
    onError,
    ...restMutationOptions,
  });
}


export function useConfirmCommission(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ customerId, proof }: { customerId: number; proof: File }) => {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required" };
      }

      const formData = new FormData();
      formData.append("proof", proof);

      const headers = getAuthHeaders();

      const response = await fetch(buildApiUrl(apiBaseUrl, `/financials/commissions/${customerId}/confirm`), {
        method: "POST",
        headers,
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw { error: parseErrorMessage(payload, "Failed to confirm commission payment") };
      }

      return payload.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      queryClient.invalidateQueries({ queryKey: ["financialSummary"] });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export const getListApartmentsQueryKey = () => ["apartments"] as const;
export const getGetApartmentQueryKey = (id: number) => ["apartment", id] as const;

export function useListApartments(opts?: any) {
  return useQuery<ApartmentRecord[]>({
    queryKey: getListApartmentsQueryKey(),
    queryFn: async () => {
      const apiBaseUrl = getEffectiveApiBaseUrl();
      if (!apiBaseUrl) return [];
      const response = await requestApi<unknown[]>("/apartments");
      return Array.isArray(response) ? (response as ApartmentRecord[]) : [];
    },
    ...opts?.query,
  });
}

export function useGetApartment(id: number, opts?: any) {
  return useQuery<ApartmentRecord | null>({
    queryKey: getGetApartmentQueryKey(id),
    queryFn: async () => {
      const apiBaseUrl = getEffectiveApiBaseUrl();
      if (!apiBaseUrl) return null;
      const response = await requestApi<unknown>(`/apartments/${id}`);
      return response as ApartmentRecord;
    },
    enabled: id > 0,
    ...opts?.query,
  });
}

export function useCreateApartment(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async ({ data }: { data: { name: string; address: string; city?: string } }) => {
      const apiBaseUrl = getEffectiveApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required to create apartments." };
      }
      const response = await requestApi<unknown>("/apartments", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response as ApartmentRecord;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: getListApartmentsQueryKey() });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

export const getCustomerNotificationsQueryKey = () => ["customer", "notifications"] as const;
export const getCustomerUnreadNotificationsCountQueryKey = () => ["customer", "notifications", "unread-count"] as const;

export function useGetCustomerNotifications(opts?: any) {
  return useQuery<any[]>({
    queryKey: getCustomerNotificationsQueryKey(),
    queryFn: async () => {
      const apiBaseUrl = getEffectiveApiBaseUrl();
      if (!apiBaseUrl) return [];
      const response = await requestApi<any[]>("/customer/notifications");
      return Array.isArray(response) ? response : [];
    },
    ...opts?.query,
  });
}

export function useGetCustomerUnreadNotificationsCount(opts?: any) {
  return useQuery<{ count: number }>({
    queryKey: getCustomerUnreadNotificationsCountQueryKey(),
    queryFn: async () => {
      const apiBaseUrl = getEffectiveApiBaseUrl();
      if (!apiBaseUrl) return { count: 0 };
      const response = await requestApi<{ count: number }>("/customer/notifications/unread-count");
      return response || { count: 0 };
    },
    ...opts?.query,
  });
}

export function useMarkCustomerNotificationRead(opts?: any) {
  const queryClient = useQueryClient();
  const mutationOptions = opts?.mutation ?? {};
  const { onSuccess, ...restMutationOptions } = mutationOptions;

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const apiBaseUrl = getEffectiveApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: "Backend API URL is required." };
      }
      return await requestApi<any>(`/customer/notifications/${notificationId}/read`, {
        method: "POST",
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: getCustomerNotificationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getCustomerUnreadNotificationsCountQueryKey() });
      onSuccess?.(data, variables, context);
    },
    ...restMutationOptions,
  });
}

