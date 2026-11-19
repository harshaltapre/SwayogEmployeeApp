export interface LiaisoningCustomer {
  id: number;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  consumerNumber?: string | null;
  fullAddress?: string | null;
  address?: string | null;
  city?: string | null;
  systemCapacityKw?: number | null;
  systemSizeKw?: number | null;
  discomName?: string | null;
  installationDate?: string | null;
}

export interface LiaisoningStage {
  id: string;
  applicationId: string;
  stage: string;
  status: "NOT_STARTED" | "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED" | "COMPLETED" | "ON_HOLD";
  remarks?: string | null;
  rejectionReason?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LiaisoningDocumentItem {
  id: string;
  applicationId: string;
  documentType: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  uploadedBy: string;
  uploadedAt: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  verificationRemarks?: string | null;
  application?: {
    id: string;
    applicationNumber?: string | null;
    discomName?: string | null;
    customer?: LiaisoningCustomer;
  };
}

export interface LiaisoningFollowUpItem {
  id: string;
  applicationId: string;
  followUpDate: string;
  followUpType: string;
  remarks?: string | null;
  status: string;
  completedAt?: string | null;
  completedBy?: string | null;
  completionNotes?: string | null;
  reminderSent: boolean;
  assignedTo?: string | null;
  createdAt: string;
  application?: {
    id: string;
    applicationNumber?: string | null;
    discomName?: string | null;
    customer?: LiaisoningCustomer;
  };
}

export interface LiaisoningAuditLogItem {
  id: string;
  applicationId: string;
  action: string;
  actorId: string;
  previousValue?: string | null;
  newValue?: string | null;
  field?: string | null;
  description?: string | null;
  metadata?: any;
  createdAt: string;
  actor?: {
    id: string;
    fullName: string;
    email: string;
  };
  application?: {
    id: string;
    applicationNumber?: string | null;
    customer?: {
      id: number;
      fullName: string;
      phoneNumber: string;
      consumerNumber?: string | null;
    };
  };
}

export interface LiaisoningApplicationItem {
  id: string;
  customerId: number;
  applicationNumber?: string | null;
  discomName?: string | null;
  applicationSubmissionDate?: string | null;
  assignedEmployeeId?: string | null;
  overallStatus: "NOT_STARTED" | "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED" | "COMPLETED" | "ON_HOLD";
  currentStage: string;
  completionPercentage: number;
  nextFollowUpDate?: string | null;
  followUpRemarks?: string | null;
  isRejected: boolean;
  rejectionReason?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: LiaisoningCustomer;
  assignedEmployee?: {
    id: string;
    fullName: string;
    email?: string;
  } | null;
  stages?: LiaisoningStage[];
  documents?: LiaisoningDocumentItem[];
  followUps?: LiaisoningFollowUpItem[];
  auditLogs?: LiaisoningAuditLogItem[];
}

export const LIAISONING_STAGES = [
  { key: "CUSTOMER_REGISTRATION", label: "Customer Registration", step: 1 },
  { key: "DOCUMENT_COLLECTION", label: "Document Collection", step: 2 },
  { key: "PORTAL_APPLICATION_SUBMISSION", label: "Portal Application Submission", step: 3 },
  { key: "TECHNICAL_FEASIBILITY_APPROVAL", label: "Technical Feasibility Approval", step: 4 },
  { key: "SOLAR_INSTALLATION", label: "Solar Installation", step: 5 },
  { key: "NET_METERING_APPLICATION", label: "Net Metering Application", step: 6 },
  { key: "DISCOM_INSPECTION", label: "DISCOM Inspection", step: 7 },
  { key: "NET_METER_INSTALLATION", label: "Net Meter Installation", step: 8 },
  { key: "COMMISSIONING_CERTIFICATE", label: "Commissioning Certificate", step: 9 },
  { key: "SUBSIDY_APPLICATION", label: "Subsidy Application", step: 10 },
  { key: "SUBSIDY_CREDITED", label: "Subsidy Credited", step: 11 },
] as const;

export function getStageLabel(stage: string): string {
  const found = LIAISONING_STAGES.find((s) => s.key === stage);
  if (found) return found.label;
  return stage.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "COMPLETED":
    case "APPROVED":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "PENDING":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "REJECTED":
      return "bg-rose-100 text-rose-800 border-rose-300";
    case "ON_HOLD":
      return "bg-slate-100 text-slate-800 border-slate-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

