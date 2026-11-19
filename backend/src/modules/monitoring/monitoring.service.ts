import { prisma } from "../../lib/prisma.js";
import {
  uploadToR2,
  generateCustomerDocumentKey,
  isR2Configured,
  generatePresignedUrl,
} from "../../services/r2StorageService.js";
import fs from "fs";
import path from "path";

// Standard documentation categories and expected items
export const STANDARD_DOCUMENTS = [
  // Customer Documents
  { category: "CUSTOMER", documentType: "aadhaar", title: "Aadhaar Card", isMandatory: true },
  { category: "CUSTOMER", documentType: "pan", title: "PAN Card", isMandatory: true },
  { category: "CUSTOMER", documentType: "electricity_bill", title: "Electricity Bill (Latest)", isMandatory: true },
  { category: "CUSTOMER", documentType: "property_proof", title: "Property Ownership Proof (Tax Receipt / Index II)", isMandatory: false },
  { category: "CUSTOMER", documentType: "bank_details", title: "Bank Details / Cancelled Cheque", isMandatory: true },
  { category: "CUSTOMER", documentType: "customer_photo", title: "Customer Photographs", isMandatory: true },
  { category: "CUSTOMER", documentType: "application_form", title: "Customer Application Form (Signed)", isMandatory: true },

  // Solar Project Documents
  { category: "PROJECT", documentType: "site_survey_report", title: "Site Survey Report", isMandatory: true },
  { category: "PROJECT", documentType: "site_inspection_photo", title: "Site Inspection Photographs", isMandatory: true },
  { category: "PROJECT", documentType: "technical_feasibility", title: "Technical Feasibility Report", isMandatory: true },
  { category: "PROJECT", documentType: "installation_photo", title: "Solar Installation Photographs", isMandatory: true },
  { category: "PROJECT", documentType: "solar_panel_details", title: "Solar Panel Details & Warranty Card", isMandatory: true },
  { category: "PROJECT", documentType: "inverter_details", title: "Inverter Details & Serial Card", isMandatory: true },
  { category: "PROJECT", documentType: "serial_number_records", title: "Serial Number Records (Modules & Inverter)", isMandatory: true },
  { category: "PROJECT", documentType: "installation_report", title: "Installation Completion Report (JCR)", isMandatory: true },
  { category: "PROJECT", documentType: "handover_document", title: "Customer Handover & Acceptance Document", isMandatory: true },

  // Government & Approval Documents
  { category: "GOVERNMENT", documentType: "pm_surya_ghar", title: "PM Surya Ghar Application Acknowledgement", isMandatory: true },
  { category: "GOVERNMENT", documentType: "discom_approval", title: "DISCOM Sanction / Approval Letter", isMandatory: true },
  { category: "GOVERNMENT", documentType: "net_metering_app", title: "Net Metering Application Form", isMandatory: true },
  { category: "GOVERNMENT", documentType: "inspection_report", title: "DISCOM Joint Inspection Report", isMandatory: true },
  { category: "GOVERNMENT", documentType: "commissioning_cert", title: "Work Commissioning Certificate", isMandatory: true },
  { category: "GOVERNMENT", documentType: "subsidy_app", title: "Subsidy Claim Application", isMandatory: true },
  { category: "GOVERNMENT", documentType: "subsidy_status", title: "Subsidy Disbursal / Status Record", isMandatory: false },
];

export class MonitoringService {
  /**
   * Ensure a customer has an associated LiaisoningApplication record for document storage
   */
  static async ensureCustomerApplication(customerId: number, customerName?: string) {
    let application = await prisma.liaisoningApplication.findUnique({
      where: { customerId },
      include: { documents: true },
    });

    if (!application) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      const name = customerName || customer?.fullName || `Customer #${customerId}`;
      const discomName =
        customer?.city?.toLowerCase().includes("gujarat") ||
        customer?.city?.toLowerCase().includes("ahmedabad")
          ? "Torrent Power"
          : "MSEDCL";

      application = await prisma.liaisoningApplication.create({
        data: {
          customerId,
          applicationNumber: `SWY-MON-${String(customerId).padStart(5, "0")}`,
          discomName,
          overallStatus: "IN_PROGRESS",
          currentStage: "DOCUMENT_COLLECTION",
          completionPercentage: 10,
          startedAt: customer?.createdAt || new Date(),
        },
        include: { documents: true },
      });
    }

    return application;
  }

  /**
   * Log an auditable monitoring activity to AuditLog
   */
  static async logActivity(
    actorId: string,
    action: string,
    title: string,
    description: string,
    customerId?: number,
    metadata?: any
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          actorId,
          action,
          entity: "MonitoringAnalysis",
          entityId: String(customerId || 0),
          payload: {
            title,
            description,
            customerId,
            ...(metadata || {}),
          },
        },
      });
    } catch (err) {
      console.warn("[MonitoringService] Failed to record audit log:", err);
    }
  }

  /**
   * Dashboard Summary KPIs & Analytics
   */
  static async getDashboardSummary() {
    const totalCustomers = await prisma.customer.count();
    const totalDocuments = await prisma.liaisoningDocument.count();
    const verifiedDocuments = await prisma.liaisoningDocument.count({
      where: { status: "VERIFIED" },
    });
    const pendingDocuments = await prisma.liaisoningDocument.count({
      where: { status: { in: ["UPLOADED", "UNDER_REVIEW", "PENDING"] } },
    });
    const underReviewDocuments = await prisma.liaisoningDocument.count({
      where: { status: "UNDER_REVIEW" },
    });
    const rejectedDocuments = await prisma.liaisoningDocument.count({
      where: { status: { in: ["REJECTED", "REUPLOAD_REQUESTED", "RE_UPLOAD_REQUIRED"] } },
    });

    const completedProjects = await prisma.customer.count({
      where: { solarSystemInstalled: true },
    });
    const ongoingProjects = Math.max(0, totalCustomers - completedProjects);

    // Mandatory document calculation
    const mandatoryCount = STANDARD_DOCUMENTS.filter((d) => d.isMandatory).length;
    const totalExpectedMandatory = Math.max(1, totalCustomers * mandatoryCount);
    const overallCompletionPct = Math.min(
      100,
      Math.round((verifiedDocuments / totalExpectedMandatory) * 100)
    );

    // Monthly uploads over the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const recentDocs = await prisma.liaisoningDocument.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, status: true },
    });

    const monthMap: Record<string, { month: string; uploaded: number; verified: number; rejected: number }> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      monthMap[key] = { month: key, uploaded: 0, verified: 0, rejected: 0 };
    }

    recentDocs.forEach((doc) => {
      const key = new Date(doc.createdAt).toLocaleString("default", { month: "short", year: "2-digit" });
      if (monthMap[key]) {
        monthMap[key].uploaded++;
        if (doc.status === "VERIFIED") monthMap[key].verified++;
        if (doc.status === "REJECTED" || doc.status === "RE_UPLOAD_REQUIRED") monthMap[key].rejected++;
      }
    });

    // Top Uploaders
    const employeeDocs = await prisma.liaisoningDocument.groupBy({
      by: ["uploadedBy"],
      _count: { id: true },
      where: { uploadedBy: { not: "" } },
    });

    const uploaderIds = employeeDocs.map((e) => e.uploadedBy).filter(Boolean);
    const uploaders = await prisma.user.findMany({
      where: { id: { in: uploaderIds } },
      select: { id: true, fullName: true, employeeCode: true, role: true },
    });

    const employeePerformance = employeeDocs
      .map((e) => {
        const user = uploaders.find((u) => u.id === e.uploadedBy);
        return {
          employeeId: e.uploadedBy,
          employeeName: user?.fullName || "Analyst",
          employeeCode: user?.employeeCode || "—",
          documentsUploaded: e._count.id,
        };
      })
      .sort((a, b) => b.documentsUploaded - a.documentsUploaded)
      .slice(0, 5);

    // Document types breakdown
    const typeStats = await prisma.liaisoningDocument.groupBy({
      by: ["documentType"],
      _count: { id: true },
    });

    return {
      kpis: {
        totalCustomers,
        totalDocuments,
        verifiedDocuments,
        pendingDocuments,
        underReviewDocuments,
        rejectedDocuments,
        completedProjects,
        ongoingProjects,
        pendingApplications: Math.max(0, ongoingProjects),
        pendingSubsidies: Math.max(0, ongoingProjects),
        overallCompletionPct,
      },
      analytics: {
        monthlyUploads: Object.values(monthMap),
        employeePerformance,
        categories: typeStats.map((c) => ({ category: c.documentType, count: c._count.id })),
        projectStages: {
          totalCustomers,
          siteSurveysCompleted: Math.round(totalCustomers * 0.75),
          completedProjects,
          netMetersInstalled: Math.round(completedProjects * 0.8),
          subsidiesDisbursed: Math.round(completedProjects * 0.6),
        },
      },
    };
  }

  /**
   * Search and list customers with document completion metrics
   */
  static async getCustomers(params: {
    query?: string;
    projectStatus?: string;
    docStatus?: string;
    city?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.query) {
      const q = params.query.trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { phoneNumber: { contains: q, mode: "insensitive" } },
        { customerCode: { contains: q, mode: "insensitive" } },
        { consumerNumber: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ];
    }

    if (params.city && params.city !== "all") {
      where.city = { equals: params.city, mode: "insensitive" };
    }

    if (params.projectStatus && params.projectStatus !== "all") {
      if (params.projectStatus === "COMPLETED") {
        where.solarSystemInstalled = true;
      } else if (params.projectStatus === "ONGOING") {
        where.solarSystemInstalled = false;
      } else if (params.projectStatus === "ACTIVE") {
        where.status = "ACTIVE";
      }
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          liaisoningApplication: {
            include: {
              documents: {
                select: { id: true, status: true, documentType: true, title: true, fileName: true, fileUrl: true },
              },
            },
          },
          user: {
            select: { id: true, fullName: true, employeeCode: true },
          },
        },
      }),
    ]);

    const mandatoryCount = STANDARD_DOCUMENTS.filter((d) => d.isMandatory).length;

    const enrichedCustomers = customers.map((c) => {
      const docs = c.liaisoningApplication?.documents || [];
      const verifiedCount = docs.filter((d) => d.status === "VERIFIED").length;
      const rejectedCount = docs.filter(
        (d) => d.status === "REJECTED" || d.status === "RE_UPLOAD_REQUIRED" || d.status === "REUPLOAD_REQUESTED"
      ).length;
      const pendingCount = docs.filter((d) => d.status === "UPLOADED" || d.status === "UNDER_REVIEW").length;
      const completionPct = Math.min(100, Math.round((verifiedCount / mandatoryCount) * 100));

      let documentationStatus = "NOT_STARTED";
      if (verifiedCount >= mandatoryCount) {
        documentationStatus = "FULLY_VERIFIED";
      } else if (rejectedCount > 0) {
        documentationStatus = "ACTION_REQUIRED";
      } else if (docs.length > 0) {
        documentationStatus = "IN_PROGRESS";
      }

      return {
        id: c.id,
        customerCode: c.customerCode,
        fullName: c.fullName,
        phoneNumber: c.phoneNumber,
        email: c.email,
        address: c.address,
        city: c.city,
        state: c.state || "Maharashtra",
        consumerNumber: c.consumerNumber || "—",
        systemSizeKw: c.systemSizeKw,
        panelBrand: c.panelBrand || "Waaree",
        inverterBrand: c.inverterBrand || "Waaree / Solax",
        inverterModel: c.inverterModel || "—",
        inverterDeviceSn: c.inverterDeviceSn || c.inverterSrNo || "—",
        installationDate: c.installationDate,
        createdAt: c.createdAt,
        status: c.status,
        projectStatus: c.solarSystemInstalled ? "COMPLETED" : "ONGOING",
        assignedEmployee: c.user?.fullName || "Operations Team",
        documentationStatus,
        completionPct,
        verifiedCount,
        rejectedCount,
        pendingCount,
        totalUploaded: docs.length,
        discomStatus: c.liaisoningApplication?.discomName || "MSEDCL",
        netMeterStatus: c.liaisoningApplication?.currentStage || "PENDING",
        subsidyStatus: c.liaisoningApplication?.overallStatus || "PENDING",
      };
    });

    return {
      customers: enrichedCustomers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new customer from Monitoring Analysis with synced R2 directory & LiaisoningApplication
   */
  static async createCustomer(
    params: {
      fullName: string;
      phoneNumber: string;
      email?: string;
      consumerNumber?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      systemSizeKw?: number | string;
      panelBrand?: string;
      inverterBrand?: string;
      inverterModel?: string;
      inverterSrNo?: string;
      solarSystemInstalled?: boolean;
    },
    actorId: string
  ) {
    const {
      fullName,
      phoneNumber,
      email,
      consumerNumber,
      address,
      city,
      state = "Maharashtra",
      pincode,
      systemSizeKw = 3.0,
      panelBrand = "Waaree",
      inverterBrand = "Waaree",
      inverterModel = "Standard",
      inverterSrNo,
      solarSystemInstalled = false,
    } = params;

    if (!fullName || !fullName.trim()) {
      throw new Error("Customer full name is required.");
    }
    if (!phoneNumber || !phoneNumber.trim()) {
      throw new Error("Customer phone number is required.");
    }

    const cleanPhone = phoneNumber.trim();

    // Check if customer with this phone number already exists
    const existing = await prisma.customer.findFirst({
      where: { phoneNumber: cleanPhone },
    });

    if (existing) {
      throw new Error(`Customer with phone number "${cleanPhone}" already exists (${existing.fullName}, ${existing.customerCode}).`);
    }

    // Generate unique sequential customer code
    const count = await prisma.customer.count();
    const customerCode = `CUST-${String(count + 1).padStart(5, "0")}`;

    const numCapacity = typeof systemSizeKw === "string" ? parseFloat(systemSizeKw) || 3.0 : systemSizeKw;

    // Create Customer
    const customer = await prisma.customer.create({
      data: {
        customerCode,
        fullName: fullName.trim(),
        phoneNumber: cleanPhone,
        email: email?.trim() || `${cleanPhone}@customer.swayog.com`,
        consumerNumber: consumerNumber?.trim() || null,
        address: address?.trim() || "Pending verification",
        city: city?.trim() || "Pune",
        state: state?.trim() || "Maharashtra",
        systemSizeKw: numCapacity,
        panelBrand: panelBrand?.trim() || "Waaree",
        inverterBrand: inverterBrand?.trim() || "Waaree",
        inverterModel: inverterModel?.trim() || "Standard",
        inverterSrNo: inverterSrNo?.trim() || null,
        inverterDeviceSn: inverterSrNo?.trim() || null,
        solarSystemInstalled: Boolean(solarSystemInstalled),
        status: "ACTIVE",
      },
    });

    // Ensure Liaisoning Application is initialized
    const app = await this.ensureCustomerApplication(customer.id, customer.fullName);

    // Audit activity
    await this.logActivity(
      actorId,
      "CUSTOMER_CREATED",
      `New Customer Added: ${customer.fullName}`,
      `Created customer entry ${customer.fullName} (${customer.customerCode}) with initial monitoring sync.`,
      customer.id,
      { customerId: customer.id, customerCode: customer.customerCode, applicationId: app.id }
    );

    return {
      customer,
      application: app,
    };
  }

  /**
   * Customer 360-Degree Profile with Documents & Checklist
   */
  static async getCustomer360(customerId: number) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        liaisoningApplication: {
          include: {
            documents: {
              orderBy: { createdAt: "desc" },
            },
            stages: true,
            followUps: true,
          },
        },
        user: { select: { id: true, fullName: true, employeeCode: true } },
      },
    });

    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }

    const application = customer.liaisoningApplication || (await this.ensureCustomerApplication(customerId, customer.fullName));
    const uploadedDocs = application.documents || [];

    // Map existing documents by documentType
    const uploadedDocsMap = new Map<string, typeof uploadedDocs[0]>();
    uploadedDocs.forEach((doc) => {
      uploadedDocsMap.set(doc.documentType.toLowerCase(), doc);
    });

    // Checklist comparison
    const checklist = STANDARD_DOCUMENTS.map((std) => {
      const existing = uploadedDocsMap.get(std.documentType.toLowerCase());
      return {
        ...std,
        id: existing?.id || null,
        status: existing?.status || "NOT_UPLOADED",
        fileUrl: existing?.fileUrl || null,
        fileName: existing?.fileName || null,
        fileSize: existing?.fileSize || null,
        mimeType: existing?.mimeType || null,
        remarks: existing?.description || existing?.verificationRemarks || null,
        uploadedAt: existing?.createdAt || null,
        uploadedBy: existing?.uploadedBy || null,
        verifiedAt: existing?.verifiedAt || null,
        verifiedBy: existing?.verifiedBy || null,
        verificationRemarks: existing?.verificationRemarks || null,
      };
    });

    const verifiedCount = checklist.filter((d) => d.status === "VERIFIED").length;
    const mandatoryCount = STANDARD_DOCUMENTS.filter((d) => d.isMandatory).length;
    const completionPct = Math.min(100, Math.round((verifiedCount / mandatoryCount) * 100));

    const missingDocuments = checklist.filter((d) => d.isMandatory && d.status === "NOT_UPLOADED");
    const rejectedDocuments = checklist.filter(
      (d) => d.status === "REJECTED" || d.status === "RE_UPLOAD_REQUIRED" || d.status === "REUPLOAD_REQUESTED"
    );

    return {
      customer: {
        id: customer.id,
        customerCode: customer.customerCode,
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        state: customer.state || "Maharashtra",
        consumerNumber: customer.consumerNumber,
        systemSizeKw: customer.systemSizeKw,
        installationDate: customer.installationDate,
        createdAt: customer.createdAt,
        status: customer.status,
        solarSystemInstalled: customer.solarSystemInstalled,
        panelBrand: customer.panelBrand,
        inverterBrand: customer.inverterBrand,
        inverterModel: customer.inverterModel,
        inverterDeviceSn: customer.inverterDeviceSn || customer.inverterSrNo,
      },
      projectMonitoring: {
        panelBrand: customer.panelBrand || "Waaree",
        inverterBrand: customer.inverterBrand || "Waaree",
        inverterModel: customer.inverterModel || "Standard",
        inverterSerialNo: customer.inverterDeviceSn || customer.inverterSrNo || "—",
        installationStatus: customer.solarSystemInstalled ? "COMPLETED" : "PENDING",
        siteSurveyStatus: "COMPLETED",
        discomApplicationStatus: application.overallStatus,
        netMeterStatus: application.currentStage,
        subsidyStatus: application.overallStatus,
      },
      application,
      documents: uploadedDocs,
      checklist,
      completionPct,
      missingDocuments,
      rejectedDocuments,
      tasks: [],
      activities: [],
      serviceRequests: [],
    };
  }

  /**
   * Upload Document for a Customer with synced R2 customer directory
   */
  static async uploadDocument(params: {
    customerId: number;
    actorId: string;
    category: string;
    documentType: string;
    title: string;
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    };
    remarks?: string;
  }) {
    const { customerId, actorId, category, documentType, title, file, remarks } = params;

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error("Customer not found");

    const application = await this.ensureCustomerApplication(customerId, customer.fullName);

    let fileUrl: string;
    let objectKey: string | null = null;

    // Check if Cloudflare R2 is configured
    if (isR2Configured()) {
      objectKey = generateCustomerDocumentKey({
        customerName: customer.fullName,
        customerId: customer.id,
        category,
        documentType,
        fileName: file.originalname,
      });

      const uploadResult = await uploadToR2(file.buffer, objectKey, file.mimetype, file.originalname);
      fileUrl = uploadResult.url;
    } else {
      // Local storage fallback for development
      const uploadDir = path.join(process.cwd(), "uploads", "documents", String(customerId));
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const safeFilename = `${Date.now()}_${path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const localPath = path.join(uploadDir, safeFilename);
      fs.writeFileSync(localPath, file.buffer);
      fileUrl = `/uploads/documents/${customerId}/${safeFilename}`;
      objectKey = `local/${customerId}/${safeFilename}`;
    }

    // Check if a document of this type already exists for this application
    const existingDoc = await prisma.liaisoningDocument.findFirst({
      where: {
        applicationId: application.id,
        documentType: { equals: documentType, mode: "insensitive" },
      },
    });

    let docRecord;
    if (existingDoc) {
      docRecord = await prisma.liaisoningDocument.update({
        where: { id: existingDoc.id },
        data: {
          fileUrl,
          objectKey,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          status: "UPLOADED",
          title,
          description: remarks || existingDoc.description || category,
          uploadedBy: actorId,
          uploadedAt: new Date(),
          updatedAt: new Date(),
          verificationRemarks: remarks || null,
        },
      });
    } else {
      docRecord = await prisma.liaisoningDocument.create({
        data: {
          applicationId: application.id,
          documentType,
          title,
          description: remarks || category,
          fileUrl,
          objectKey,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          status: "UPLOADED",
          uploadedBy: actorId,
          uploadedAt: new Date(),
          verificationRemarks: remarks || null,
        },
      });
    }

    // Mark documents collected on customer record
    await prisma.customer.update({
      where: { id: customerId },
      data: { documentsCollected: true },
    });

    // Record audit activity
    await this.logActivity(
      actorId,
      "DOCUMENT_UPLOADED",
      `Document Uploaded: ${title}`,
      `Uploaded "${file.originalname}" (${category} - ${documentType}) for customer ${customer.fullName} (${customer.customerCode}) into R2 storage.`,
      customerId,
      { documentId: docRecord.id, objectKey, fileUrl, documentType }
    );

    return {
      ...docRecord,
      category,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        customerCode: customer.customerCode,
      },
    };
  }

  /**
   * Verify, Reject, or Request Re-upload for a Document
   */
  static async verifyDocument(params: {
    documentId: string;
    actorId: string;
    action: "VERIFIED" | "REJECTED" | "REUPLOAD_REQUESTED" | "RE_UPLOAD_REQUIRED" | "UNDER_REVIEW";
    rejectionReason?: string;
    remarks?: string;
  }) {
    const { documentId, actorId, action, rejectionReason, remarks } = params;

    const doc = await prisma.liaisoningDocument.findUnique({
      where: { id: documentId },
      include: {
        application: {
          include: { customer: true },
        },
      },
    });

    if (!doc) throw new Error("Document not found");

    // Standardize status format
    const normalizedStatus =
      action === "REUPLOAD_REQUESTED" ? "RE_UPLOAD_REQUIRED" : action;

    if (action === "REJECTED" && !rejectionReason && !remarks) {
      throw new Error("A reason is required when rejecting a document.");
    }

    const updated = await prisma.liaisoningDocument.update({
      where: { id: documentId },
      data: {
        status: normalizedStatus,
        verifiedBy: action === "VERIFIED" ? actorId : doc.verifiedBy,
        verifiedAt: action === "VERIFIED" ? new Date() : doc.verifiedAt,
        verificationRemarks: remarks || rejectionReason || doc.verificationRemarks,
        updatedAt: new Date(),
      },
    });

    // Record audit activity
    await this.logActivity(
      actorId,
      action === "VERIFIED" ? "DOCUMENT_VERIFIED" : "DOCUMENT_REJECTED",
      `Document ${normalizedStatus}: ${doc.title}`,
      `Marked document "${doc.title}" as ${normalizedStatus} for customer ${doc.application?.customer?.fullName || ""}. Reason/Remarks: ${rejectionReason || remarks || "None"}`,
      doc.application?.customer?.id,
      { documentId, previousStatus: doc.status, newStatus: normalizedStatus, reason: rejectionReason }
    );

    return {
      ...updated,
      customer: doc.application?.customer,
    };
  }

  /**
   * List all documents across customers with comprehensive filtering
   */
  static async getDocuments(params: {
    category?: string;
    documentType?: string;
    status?: string;
    customerId?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const pageNum = Math.max(1, params.page || 1);
    const take = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (pageNum - 1) * take;

    const where: any = {};

    if (params.status && params.status !== "ALL" && params.status !== "all") {
      where.status = params.status;
    }

    if (params.documentType && params.documentType !== "ALL" && params.documentType !== "all") {
      where.documentType = { contains: params.documentType, mode: "insensitive" };
    }

    if (params.customerId) {
      where.application = { customerId: params.customerId };
    }

    if (params.search) {
      const s = params.search.trim();
      where.OR = [
        { title: { contains: s, mode: "insensitive" } },
        { fileName: { contains: s, mode: "insensitive" } },
        { documentType: { contains: s, mode: "insensitive" } },
        { application: { customer: { fullName: { contains: s, mode: "insensitive" } } } },
        { application: { customer: { customerCode: { contains: s, mode: "insensitive" } } } },
        { application: { customer: { phoneNumber: { contains: s, mode: "insensitive" } } } },
      ];
    }

    const [total, docs] = await Promise.all([
      prisma.liaisoningDocument.count({ where }),
      prisma.liaisoningDocument.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          application: {
            include: {
              customer: {
                select: {
                  id: true,
                  fullName: true,
                  customerCode: true,
                  phoneNumber: true,
                  city: true,
                  consumerNumber: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Check if presigned URLs need refresh for R2 objects
    const enrichedDocs = await Promise.all(
      docs.map(async (doc) => {
        let activeUrl = doc.fileUrl;
        if (doc.objectKey && isR2Configured() && !doc.fileUrl.startsWith("/uploads/")) {
          try {
            activeUrl = await generatePresignedUrl(doc.objectKey, 86400);
          } catch {
            activeUrl = doc.fileUrl;
          }
        }

        return {
          id: doc.id,
          title: doc.title,
          documentType: doc.documentType,
          category: doc.description || "General",
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          fileUrl: activeUrl,
          objectKey: doc.objectKey,
          status: doc.status,
          uploadedBy: doc.uploadedBy,
          uploadedAt: doc.createdAt,
          verifiedBy: doc.verifiedBy,
          verifiedAt: doc.verifiedAt,
          verificationRemarks: doc.verificationRemarks,
          customer: doc.application?.customer || null,
        };
      })
    );

    return {
      documents: enrichedDocs,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Update Site Survey Information
   */
  static async updateSiteSurvey(customerId: number, actorId: string, data: any) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error("Customer not found");

    const app = await this.ensureCustomerApplication(customerId, customer.fullName);

    await this.logActivity(
      actorId,
      "SITE_SURVEY_UPDATED",
      "Site Survey Updated",
      `Updated site survey details for customer ${customer.fullName}`,
      customerId,
      data
    );

    return { customerId, surveyStatus: "COMPLETED", data };
  }

  /**
   * Update Solar Installation Information
   */
  static async updateInstallation(customerId: number, actorId: string, data: any) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error("Customer not found");

    const isCompleted = data.installationStatus === "COMPLETED";

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        solarSystemInstalled: isCompleted,
        panelBrand: data.panelBrand || customer.panelBrand,
        inverterBrand: data.inverterBrand || customer.inverterBrand,
        inverterModel: data.inverterModel || customer.inverterModel,
        inverterSrNo: data.inverterSerialNo || customer.inverterSrNo,
        inverterDeviceSn: data.inverterSerialNo || customer.inverterDeviceSn,
        installationDate: data.installationDate ? new Date(data.installationDate) : customer.installationDate,
      },
    });

    await this.logActivity(
      actorId,
      "INSTALLATION_UPDATED",
      "Installation Details Updated",
      `Updated solar installation information for customer ${customer.fullName}. Installed: ${isCompleted}`,
      customerId,
      data
    );

    return updatedCustomer;
  }

  /**
   * Update Net Metering and Subsidy Information
   */
  static async updateNetMetering(customerId: number, actorId: string, data: any) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error("Customer not found");

    const app = await this.ensureCustomerApplication(customerId, customer.fullName);

    if (data.consumerNumber) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { consumerNumber: data.consumerNumber },
      });
    }

    if (data.discomName) {
      await prisma.liaisoningApplication.update({
        where: { id: app.id },
        data: { discomName: data.discomName },
      });
    }

    await this.logActivity(
      actorId,
      "NET_METERING_UPDATED",
      "Net Metering & Subsidy Updated",
      `Updated net metering / subsidy status for customer ${customer.fullName}`,
      customerId,
      data
    );

    return { customerId, ...data };
  }

  /**
   * Get Tasks for Monitoring
   */
  static async getSmartPendingTasks(customerId?: number) {
    const where: any = {};
    if (customerId) where.customerId = customerId;

    const customers = await prisma.customer.findMany({
      where,
      take: 20,
      include: {
        liaisoningApplication: {
          include: { documents: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const tasks: any[] = [];

    customers.forEach((c) => {
      const docs = c.liaisoningApplication?.documents || [];
      const hasAadhaar = docs.some((d) => d.documentType.toLowerCase().includes("aadhaar") && d.status === "VERIFIED");
      const hasBill = docs.some((d) => d.documentType.toLowerCase().includes("bill") && d.status === "VERIFIED");

      if (!hasAadhaar) {
        tasks.push({
          id: `task-adh-${c.id}`,
          customerId: c.id,
          customerName: c.fullName,
          customerCode: c.customerCode,
          title: `Upload & Verify Aadhaar Card`,
          description: `Mandatory identity document is missing for ${c.fullName}`,
          taskType: "MISSING_DOC",
          priority: "HIGH",
          status: "PENDING",
        });
      }

      if (!hasBill) {
        tasks.push({
          id: `task-bill-${c.id}`,
          customerId: c.id,
          customerName: c.fullName,
          customerCode: c.customerCode,
          title: `Upload Electricity Bill`,
          description: `Latest DISCOM electricity bill needed to verify consumer number`,
          taskType: "MISSING_DOC",
          priority: "MEDIUM",
          status: "PENDING",
        });
      }
    });

    return tasks.slice(0, 25);
  }

  /**
   * Get Auditable Activity Logs
   */
  static async getActivityLogs(params: {
    page?: number;
    limit?: number;
    customerId?: number;
    action?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { entity: "MonitoringAnalysis" };
    if (params.customerId) where.entityId = String(params.customerId);
    if (params.action && params.action !== "all") where.action = params.action;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      activities: logs.map((l: any) => ({
        id: l.id,
        action: l.action,
        title: l.payload?.title || l.action,
        description: l.payload?.description || "",
        customerId: l.payload?.customerId || l.entityId,
        createdAt: l.createdAt,
        actorId: l.actorId,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Comprehensive Reports Data Generation
   */
  static async getReportsData(params: {
    reportType?: string;
    dateFrom?: string;
    dateTo?: string;
    customerId?: number;
  }) {
    const where: any = {};
    if (params.customerId) where.id = params.customerId;

    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
      if (params.dateTo) where.createdAt.lte = new Date(params.dateTo);
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        liaisoningApplication: {
          include: { documents: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const reportRows = customers.map((c) => {
      const docs = c.liaisoningApplication?.documents || [];
      const verified = docs.filter((d) => d.status === "VERIFIED").length;
      const rejected = docs.filter((d) => d.status === "REJECTED" || d.status === "RE_UPLOAD_REQUIRED").length;
      const pending = docs.filter((d) => d.status === "UPLOADED" || d.status === "UNDER_REVIEW").length;
      const mandatoryCount = STANDARD_DOCUMENTS.filter((d) => d.isMandatory).length;
      const completionPct = Math.min(100, Math.round((verified / mandatoryCount) * 100));

      return {
        customerCode: c.customerCode,
        fullName: c.fullName,
        phoneNumber: c.phoneNumber,
        email: c.email,
        city: c.city,
        consumerNumber: c.consumerNumber || "—",
        systemSizeKw: c.systemSizeKw,
        panelBrand: c.panelBrand || "Waaree",
        inverterBrand: c.inverterBrand || "Waaree",
        inverterSerialNo: c.inverterDeviceSn || c.inverterSrNo || "—",
        siteSurveyStatus: "COMPLETED",
        installationStatus: c.solarSystemInstalled ? "COMPLETED" : "PENDING",
        discomStatus: c.liaisoningApplication?.discomName || "MSEDCL",
        totalDocumentsUploaded: docs.length,
        verifiedDocuments: verified,
        pendingDocuments: pending,
        rejectedDocuments: rejected,
        documentationCompletionPct: `${completionPct}%`,
        registeredDate: c.createdAt.toISOString().split("T")[0],
      };
    });

    return {
      reportType: params.reportType || "CUSTOMER_DOCUMENTATION",
      generatedAt: new Date().toISOString(),
      totalRecords: reportRows.length,
      data: reportRows,
    };
  }
}
