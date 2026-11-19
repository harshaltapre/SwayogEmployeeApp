import { prisma } from "../../lib/prisma.js";
import { uploadToR2, generateObjectKey, isR2Configured } from "../../services/r2StorageService.js";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|webp/;
    const extname = allowed.test(file.originalname.toLowerCase().split('.').pop() || '');
    const mimetype = allowed.test(file.mimetype) || file.mimetype === "application/pdf";
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only PDF, JPG, JPEG, PNG, and WEBP files are allowed."));
  },
});

export class LiaisoningService {
  /**
   * Returns the IDs of all CRM customers who originated from a converted marketing lead.
   * Only these customers should be visible/managed in the Liaisoning section.
   */
  static async getConvertedCustomerIds(): Promise<number[]> {
    const convertedLeads = await prisma.marketingLead.findMany({
      where: {
        status: { equals: "Converted", mode: "insensitive" },
      },
      select: {
        phone: true,
        email: true,
      },
    });

    const phones = convertedLeads.map((l) => l.phone).filter(Boolean);
    const emails = convertedLeads.map((l) => l.email).filter(Boolean) as string[];

    if (phones.length === 0 && emails.length === 0) {
      return [];
    }

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          ...(phones.length > 0 ? [{ phoneNumber: { in: phones } }] : []),
          ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
        ],
      },
      select: { id: true },
    });

    return customers.map((c) => c.id);
  }

  /**
   * Automatically ensure any converted marketing lead has a CRM Customer and a Liaisoning Application
   */
  static async ensureCustomersSynced() {
    try {
      const convertedLeads = await prisma.marketingLead.findMany({
        where: {
          status: { equals: "Converted", mode: "insensitive" },
        },
      });

      if (!convertedLeads || convertedLeads.length === 0) return;

      const ALL_STAGES = [
        "CUSTOMER_REGISTRATION",
        "DOCUMENT_COLLECTION",
        "PORTAL_APPLICATION_SUBMISSION",
        "TECHNICAL_FEASIBILITY_APPROVAL",
        "SOLAR_INSTALLATION",
        "NET_METERING_APPLICATION",
        "DISCOM_INSPECTION",
        "NET_METER_INSTALLATION",
        "COMMISSIONING_CERTIFICATE",
        "SUBSIDY_APPLICATION",
        "SUBSIDY_CREDITED",
      ] as const;

      for (const lead of convertedLeads) {
        let customer = await prisma.customer.findFirst({
          where: {
            OR: [
              ...(lead.phone ? [{ phoneNumber: lead.phone }] : []),
              ...(lead.email ? [{ email: lead.email }] : []),
            ],
          },
        });

        if (!customer) {
          const custCount = await prisma.customer.count();
          const customerCode = `CUST-${String(custCount + 1).padStart(5, "0")}`;
          customer = await prisma.customer.create({
            data: {
              customerCode,
              fullName: lead.name,
              phoneNumber: lead.phone,
              email: lead.email || `${lead.phone}@customer.swayog.com`,
              city: lead.address ? lead.address.split(",")[0].trim() : "Unknown",
              address: lead.address || "Address pending verification",
              systemSizeKw: 3.0,
              installationDate: new Date(),
              status: "ACTIVE",
            },
          });
        }

        const existingApp = await prisma.liaisoningApplication.findUnique({
          where: { customerId: customer.id },
        });

        if (!existingApp) {
          const discomName =
            customer.city?.toLowerCase().includes("gujarat") ||
            customer.city?.toLowerCase().includes("ahmedabad") ||
            customer.city?.toLowerCase().includes("surat")
              ? "Torrent Power"
              : "MSEDCL";

          const stagesData = ALL_STAGES.map((stage) => ({
            stage,
            status: stage === "CUSTOMER_REGISTRATION" ? ("COMPLETED" as const) : ("NOT_STARTED" as const),
            completedAt: stage === "CUSTOMER_REGISTRATION" ? new Date() : null,
          }));

          await prisma.liaisoningApplication.create({
            data: {
              customerId: customer.id,
              applicationNumber: `SWY-LIA-${String(customer.id).padStart(4, "0")}`,
              discomName,
              overallStatus: "PENDING",
              currentStage: "DOCUMENT_COLLECTION",
              completionPercentage: 9,
              startedAt: customer.createdAt || new Date(),
              stages: {
                create: stagesData,
              },
            },
          });
        }
      }
    } catch (err) {
      console.warn("[LiaisoningService] ensureCustomersSynced error:", err);
    }
  }

  /**
   * Get dashboard summary statistics
   */
  static async getDashboardSummary() {
    await this.ensureCustomersSynced();
    const customerIds = await this.getConvertedCustomerIds();
    const baseWhere = { customerId: { in: customerIds } };

    const totalApplications = await prisma.liaisoningApplication.count({
      where: baseWhere,
    });
    
    const submittedApplications = await prisma.liaisoningApplication.count({
      where: {
        ...baseWhere,
        applicationSubmissionDate: { not: null },
      },
    });
    
    const feasibilityPending = await prisma.liaisoningApplication.count({
      where: {
        ...baseWhere,
        stages: {
          some: {
            stage: "TECHNICAL_FEASIBILITY_APPROVAL",
            status: { in: ["PENDING", "IN_PROGRESS"] },
          },
        },
      },
    });
    
    const feasibilityApproved = await prisma.liaisoningApplication.count({
      where: {
        ...baseWhere,
        stages: {
          some: {
            stage: "TECHNICAL_FEASIBILITY_APPROVAL",
            status: "APPROVED",
          },
        },
      },
    });
    
    const netMeteringPending = await prisma.liaisoningApplication.count({
      where: {
        ...baseWhere,
        stages: {
          some: {
            stage: "NET_METERING_APPLICATION",
            status: { in: ["PENDING", "IN_PROGRESS"] },
          },
        },
      },
    });
    
    const inspectionPending = await prisma.liaisoningApplication.count({
      where: {
        ...baseWhere,
        stages: {
          some: {
            stage: "DISCOM_INSPECTION",
            status: { in: ["PENDING", "IN_PROGRESS"] },
          },
        },
      },
    });
    
    const commissioningCompleted = await prisma.liaisoningApplication.count({
      where: {
        ...baseWhere,
        stages: {
          some: {
            stage: "COMMISSIONING_CERTIFICATE",
            status: "COMPLETED",
          },
        },
      },
    });
    
    const subsidyPending = await prisma.liaisoningApplication.count({
      where: {
        ...baseWhere,
        stages: {
          some: {
            stage: { in: ["SUBSIDY_APPLICATION", "SUBSIDY_CREDITED"] },
            status: { in: ["PENDING", "IN_PROGRESS", "APPROVED"] },
          },
        },
      },
    });
    
    return {
      totalApplications,
      submittedApplications,
      feasibilityPending,
      feasibilityApproved,
      netMeteringPending,
      inspectionPending,
      commissioningCompleted,
      subsidyPending,
    };
  }

  /**
   * Get all liaisoning applications with filters
   */
  static async getApplications(filters: {
    query?: string;
    discomName?: string;
    overallStatus?: string;
    currentStage?: string;
    assignedEmployeeId?: string;
    page?: number;
    limit?: number;
  }) {
    await this.ensureCustomersSynced();
    const customerIds = await this.getConvertedCustomerIds();
    const { query, discomName, overallStatus, currentStage, assignedEmployeeId, page = 1, limit = 20 } = filters;
    
    const where: any = {
      customerId: { in: customerIds },
    };
    
    if (query) {
      where.AND = [
        {
          OR: [
            { customer: { fullName: { contains: query, mode: "insensitive" } } },
            { customer: { phoneNumber: { contains: query } } },
            { applicationNumber: { contains: query, mode: "insensitive" } },
            { customer: { consumerNumber: { contains: query, mode: "insensitive" } } },
          ],
        },
      ];
    }
    
    if (discomName) {
      where.discomName = { contains: discomName, mode: "insensitive" };
    }
    
    if (overallStatus) {
      where.overallStatus = overallStatus;
    }
    
    if (currentStage) {
      where.currentStage = currentStage;
    }
    
    if (assignedEmployeeId) {
      where.assignedEmployeeId = assignedEmployeeId;
    }
    
    const [total, applications] = await Promise.all([
      prisma.liaisoningApplication.count({ where }),
      prisma.liaisoningApplication.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              consumerNumber: true,
              city: true,
              systemSizeKw: true,
            },
          },
          assignedEmployee: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
            },
          },
          stages: {
            orderBy: { stage: "asc" },
          },
        },
      }),
    ]);
    
    return {
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get liaisoning application by ID with full details
   */
  static async getApplicationById(applicationId: string) {
    const application = await prisma.liaisoningApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: true,
        assignedEmployee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            phoneNumber: true,
          },
        },
        stages: {
          orderBy: { stage: "asc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        followUps: {
          orderBy: { followUpDate: "desc" },
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          include: {
            actor: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });
    
    if (!application) {
      throw new Error("Liaisoning application not found");
    }
    
    return application;
  }

  /**
   * Create or initialize liaisoning application for a customer
   */
  static async initializeApplication(customerId: number, actorId: string) {
    // Check if application already exists
    const existing = await prisma.liaisoningApplication.findUnique({
      where: { customerId },
    });
    
    if (existing) {
      return existing;
    }
    
    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    
    if (!customer) {
      throw new Error("Customer not found");
    }
    
    // Create application with all stages
    const application = await prisma.liaisoningApplication.create({
      data: {
        customerId,
        currentStage: "CUSTOMER_REGISTRATION",
        overallStatus: "NOT_STARTED",
        startedAt: new Date(),
        stages: {
          create: [
            { stage: "CUSTOMER_REGISTRATION", status: "NOT_STARTED" },
            { stage: "DOCUMENT_COLLECTION", status: "NOT_STARTED" },
            { stage: "PORTAL_APPLICATION_SUBMISSION", status: "NOT_STARTED" },
            { stage: "TECHNICAL_FEASIBILITY_APPROVAL", status: "NOT_STARTED" },
            { stage: "SOLAR_INSTALLATION", status: "NOT_STARTED" },
            { stage: "NET_METERING_APPLICATION", status: "NOT_STARTED" },
            { stage: "DISCOM_INSPECTION", status: "NOT_STARTED" },
            { stage: "NET_METER_INSTALLATION", status: "NOT_STARTED" },
            { stage: "COMMISSIONING_CERTIFICATE", status: "NOT_STARTED" },
            { stage: "SUBSIDY_APPLICATION", status: "NOT_STARTED" },
            { stage: "SUBSIDY_CREDITED", status: "NOT_STARTED" },
          ],
        },
      },
      include: {
        stages: true,
      },
    });
    
    // Log initialization
    await this.logAuditLog(application.id, actorId, "APPLICATION_INITIALIZED", "Liaisoning application initialized", {
      customerId,
      customerName: customer.fullName,
    });
    
    return application;
  }

  /**
   * Update application details
   */
  static async updateApplication(applicationId: string, actorId: string, data: {
    applicationNumber?: string;
    discomName?: string;
    applicationSubmissionDate?: Date;
    assignedEmployeeId?: string;
    nextFollowUpDate?: Date;
    followUpRemarks?: string;
    overallStatus?: string;
    currentStage?: string;
  }) {
    const previous = await prisma.liaisoningApplication.findUnique({
      where: { id: applicationId },
    });
    
    if (!previous) {
      throw new Error("Liaisoning application not found");
    }
    
    const changes: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && previous[key as keyof typeof previous] !== value) {
        changes[key] = value;
      }
    }
    
    if (Object.keys(changes).length === 0) {
      return previous;
    }
    
    const updated = await prisma.liaisoningApplication.update({
      where: { id: applicationId },
      data: changes,
    });
    
    // Log changes
    for (const [key, value] of Object.entries(changes)) {
      await this.logAuditLog(
        applicationId,
        actorId,
        "APPLICATION_UPDATED",
        `Updated ${key}`,
        {
          field: key,
          previousValue: String(previous[key as keyof typeof previous]),
          newValue: String(value),
        }
      );
    }
    
    return updated;
  }

  /**
   * Update stage status
   */
  static async updateStageStatus(
    applicationId: string,
    stage: string,
    status: string,
    actorId: string,
    data?: {
      remarks?: string;
      rejectionReason?: string;
    }
  ) {
    let stageEntry = await prisma.liaisoningProcessStageEntry.findUnique({
      where: {
        applicationId_stage: {
          applicationId,
          stage: stage as any,
        },
      },
    });
    
    if (!stageEntry) {
      stageEntry = await prisma.liaisoningProcessStageEntry.create({
        data: {
          applicationId,
          stage: stage as any,
          status: "NOT_STARTED",
        },
      });
    }
    
    const updateData: any = {
      status: status as any,
    };
    
    if (status === "IN_PROGRESS" && !stageEntry.startedAt) {
      updateData.startedAt = new Date();
    }
    
    if ((status === "COMPLETED" || status === "APPROVED") && !stageEntry.completedAt) {
      updateData.completedAt = new Date();
      updateData.approvedBy = actorId;
      updateData.approvedAt = new Date();
    }
    
    if (status === "REJECTED") {
      updateData.completedAt = new Date();
      updateData.rejectedBy = actorId;
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = data?.rejectionReason;
    }
    
    if (data?.remarks !== undefined) {
      updateData.remarks = data.remarks;
    }
    
    const updated = await prisma.liaisoningProcessStageEntry.update({
      where: { id: stageEntry.id },
      data: updateData,
    });
    
    // Log status change
    await this.logAuditLog(
      applicationId,
      actorId,
      "STAGE_STATUS_CHANGED",
      `Updated ${stage} status to ${status}`,
      {
        stage,
        previousStatus: stageEntry.status,
        newStatus: status,
        remarks: data?.remarks,
      }
    );
    
    // Update overall application status if needed
    await this.updateOverallProgress(applicationId, actorId);
    
    return updated;
  }

  /**
   * Update overall progress based on stage statuses
   */
  private static async updateOverallProgress(applicationId: string, actorId: string) {
    const application = await prisma.liaisoningApplication.findUnique({
      where: { id: applicationId },
      include: { stages: true },
    });
    
    if (!application) return;
    
    const ORDERED_STAGES = [
      "CUSTOMER_REGISTRATION",
      "DOCUMENT_COLLECTION",
      "PORTAL_APPLICATION_SUBMISSION",
      "TECHNICAL_FEASIBILITY_APPROVAL",
      "SOLAR_INSTALLATION",
      "NET_METERING_APPLICATION",
      "DISCOM_INSPECTION",
      "NET_METER_INSTALLATION",
      "COMMISSIONING_CERTIFICATE",
      "SUBSIDY_APPLICATION",
      "SUBSIDY_CREDITED",
    ] as const;

    const totalStages = ORDERED_STAGES.length;
    const stageMap = new Map<string, any>(application.stages.map((s) => [s.stage, s]));

    let completedStages = 0;
    let hasInProgress = false;
    let hasRejected = false;
    let nextActiveStage: string | null = null;

    for (const stageName of ORDERED_STAGES) {
      const entry = stageMap.get(stageName);
      const st = entry?.status || "NOT_STARTED";

      if (st === "COMPLETED" || st === "APPROVED") {
        completedStages++;
      } else {
        if (!nextActiveStage) {
          nextActiveStage = stageName;
        }
        if (st === "IN_PROGRESS") hasInProgress = true;
        if (st === "REJECTED") hasRejected = true;
      }
    }

    const completionPercentage = Math.round((completedStages / totalStages) * 100);

    // Active current stage: either the first incomplete stage or the final stage if all completed
    const currentStage = nextActiveStage || ORDERED_STAGES[ORDERED_STAGES.length - 1];

    let overallStatus = "NOT_STARTED";
    if (hasRejected) {
      overallStatus = "REJECTED";
    } else if (completionPercentage === 100) {
      overallStatus = "COMPLETED";
    } else if (hasInProgress) {
      overallStatus = "IN_PROGRESS";
    } else if (completedStages > 0) {
      overallStatus = "IN_PROGRESS";
    }
    
    await prisma.liaisoningApplication.update({
      where: { id: applicationId },
      data: {
        completionPercentage,
        currentStage,
        overallStatus: overallStatus as any,
        completedAt: overallStatus === "COMPLETED" ? new Date() : null,
      },
    });
  }

  /**
   * Upload document
   */
  static async uploadDocument(
    applicationId: string,
    actorId: string,
    file: Express.Multer.File,
    data: {
      documentType: string;
      title: string;
      description?: string;
    }
  ) {
    const application = await prisma.liaisoningApplication.findUnique({
      where: { id: applicationId },
    });
    
    if (!application) {
      throw new Error("Liaisoning application not found");
    }
    
    let fileUrl: string;
    let objectKey: string | undefined;
    
    if (isR2Configured()) {
      objectKey = generateObjectKey({ taskId: applicationId, type: "document" }, file.originalname);
      const uploadResult = await uploadToR2(file.buffer, objectKey, file.mimetype, file.originalname);
      fileUrl = uploadResult.url;
    } else {
      // Fallback to local storage (for development)
      fileUrl = `/uploads/liaisoning/${applicationId}/${file.originalname}`;
    }
    
    const document = await prisma.liaisoningDocument.create({
      data: {
        applicationId,
        documentType: data.documentType,
        title: data.title,
        description: data.description,
        fileUrl,
        objectKey,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: actorId,
      },
    });
    
    // Log document upload
    await this.logAuditLog(
      applicationId,
      actorId,
      "DOCUMENT_UPLOADED",
      `Uploaded document: ${data.title}`,
      {
        documentType: data.documentType,
        fileName: file.originalname,
      }
    );
    
    return document;
  }

  /**
   * Add follow-up
   */
  static async addFollowUp(
    applicationId: string,
    actorId: string,
    data: {
      followUpDate: Date;
      followUpType: string;
      remarks?: string;
      assignedTo?: string;
    }
  ) {
    const application = await prisma.liaisoningApplication.findUnique({
      where: { id: applicationId },
    });
    
    if (!application) {
      throw new Error("Liaisoning application not found");
    }
    
    const followUp = await prisma.liaisoningFollowUp.create({
      data: {
        applicationId,
        followUpDate: data.followUpDate,
        followUpType: data.followUpType,
        remarks: data.remarks,
        assignedTo: data.assignedTo,
      },
    });
    
    // Update application's next follow-up date
    await prisma.liaisoningApplication.update({
      where: { id: applicationId },
      data: {
        nextFollowUpDate: data.followUpDate,
        followUpRemarks: data.remarks,
      },
    });
    
    // Log follow-up addition
    await this.logAuditLog(
      applicationId,
      actorId,
      "FOLLOW_UP_ADDED",
      `Added follow-up for ${data.followUpDate.toISOString().split('T')[0]}`,
      {
        followUpType: data.followUpType,
        assignedTo: data.assignedTo,
      }
    );
    
    return followUp;
  }

  /**
   * Complete follow-up
   */
  static async completeFollowUp(followUpId: string, actorId: string, data: {
    completionNotes?: string;
  }) {
    const followUp = await prisma.liaisoningFollowUp.findUnique({
      where: { id: followUpId },
    });
    
    if (!followUp) {
      throw new Error("Follow-up not found");
    }
    
    const updated = await prisma.liaisoningFollowUp.update({
      where: { id: followUpId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completedBy: actorId,
        completionNotes: data.completionNotes,
      },
    });
    
    // Log follow-up completion
    await this.logAuditLog(
      followUp.applicationId,
      actorId,
      "FOLLOW_UP_COMPLETED",
      `Completed follow-up scheduled for ${followUp.followUpDate.toISOString().split('T')[0]}`,
      {
        followUpId,
        completionNotes: data.completionNotes,
      }
    );
    
    return updated;
  }

  /**
   * Log audit entry
   */
  private static async logAuditLog(
    applicationId: string,
    actorId: string,
    action: string,
    description: string,
    metadata?: any
  ) {
    try {
      let validActorId = actorId;
      const userExists = await prisma.user.findUnique({
        where: { id: actorId },
        select: { id: true },
      });
      if (!userExists) {
        const fallback = await prisma.user.findFirst({ select: { id: true } });
        if (!fallback) return;
        validActorId = fallback.id;
      }

      await prisma.liaisoningAuditLog.create({
        data: {
          applicationId,
          actorId: validActorId,
          action,
          description,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch (err) {
      console.error("[LiaisoningService] Failed to record audit log:", err);
    }
  }

  /**
   * Get reports data
   */
  static async getReports(type: string, filters: {
    startDate?: Date;
    endDate?: Date;
    discomName?: string;
    employeeId?: string;
  }) {
    const { startDate, endDate, discomName, employeeId } = filters;
    const customerIds = await this.getConvertedCustomerIds();
    
    const baseWhere: any = {
      customerId: { in: customerIds },
    };
    if (startDate || endDate) {
      baseWhere.createdAt = {};
      if (startDate) baseWhere.createdAt.gte = startDate;
      if (endDate) baseWhere.createdAt.lte = endDate;
    }
    if (discomName) {
      baseWhere.discomName = { contains: discomName, mode: "insensitive" };
    }
    if (employeeId) {
      baseWhere.assignedEmployeeId = employeeId;
    }
    
    switch (type) {
      case "daily":
        return this.getDailyReport(baseWhere);
      case "monthly":
        return this.getMonthlyReport(baseWhere);
      case "discom":
        return this.getDiscomReport(baseWhere);
      case "pending":
        return this.getPendingReport(baseWhere);
      case "employee":
        return this.getEmployeeReport(baseWhere);
      case "subsidy":
        return this.getSubsidyReport(baseWhere);
      default:
        throw new Error("Invalid report type");
    }
  }

  private static async getDailyReport(where: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const applications = await prisma.liaisoningApplication.findMany({
      where: {
        ...where,
        createdAt: { gte: today },
      },
      include: {
        customer: true,
        assignedEmployee: true,
      },
    });
    
    return {
      type: "daily",
      date: today.toISOString().split('T')[0],
      total: applications.length,
      applications,
    };
  }

  private static async getMonthlyReport(where: any) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const applications = await prisma.liaisoningApplication.findMany({
      where: {
        ...where,
        createdAt: { gte: startOfMonth },
      },
      include: {
        customer: true,
        assignedEmployee: true,
      },
    });
    
    return {
      type: "monthly",
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      total: applications.length,
      applications,
    };
  }

  private static async getDiscomReport(where: any) {
    const applications = await prisma.liaisoningApplication.findMany({
      where,
      include: {
        customer: true,
        assignedEmployee: true,
      },
    });
    
    const byDiscom = applications.reduce((acc, app) => {
      const discom = app.discomName || "Unknown";
      if (!acc[discom]) {
        acc[discom] = [];
      }
      acc[discom].push(app);
      return acc;
    }, {} as Record<string, any[]>);
    
    return {
      type: "discom",
      byDiscom,
      total: applications.length,
    };
  }

  private static async getPendingReport(where: any) {
    const applications = await prisma.liaisoningApplication.findMany({
      where: {
        ...where,
        overallStatus: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: {
        customer: true,
        assignedEmployee: true,
        stages: true,
      },
    });
    
    return {
      type: "pending",
      total: applications.length,
      applications,
    };
  }

  private static async getEmployeeReport(where: any) {
    const applications = await prisma.liaisoningApplication.findMany({
      where: {
        ...where,
        assignedEmployeeId: { not: null },
      },
      include: {
        customer: true,
        assignedEmployee: true,
      },
    });
    
    const byEmployee = applications.reduce((acc, app) => {
      const employeeId = app.assignedEmployeeId || "unassigned";
      const employeeName = app.assignedEmployee?.fullName || "Unassigned";
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employeeName,
          applications: [],
          total: 0,
          completed: 0,
          pending: 0,
        };
      }
      acc[employeeId].applications.push(app);
      acc[employeeId].total++;
      if (app.overallStatus === "COMPLETED") {
        acc[employeeId].completed++;
      } else {
        acc[employeeId].pending++;
      }
      return acc;
    }, {} as Record<string, any>);
    
    return {
      type: "employee",
      byEmployee,
      total: applications.length,
    };
  }

  private static async getSubsidyReport(where: any) {
    const applications = await prisma.liaisoningApplication.findMany({
      where,
      include: {
        customer: true,
        assignedEmployee: true,
        stages: {
          where: {
            stage: { in: ["SUBSIDY_APPLICATION", "SUBSIDY_CREDITED"] },
          },
        },
      },
    });
    
    return {
      type: "subsidy",
      total: applications.length,
      applications,
    };
  }

  /**
   * Get audit logs / activity history
   */
  static async getAuditLogs(filters?: { applicationId?: string; limit?: number; page?: number }) {
    const customerIds = await this.getConvertedCustomerIds();
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      application: { customerId: { in: customerIds } },
    };
    if (filters?.applicationId) {
      where.applicationId = filters.applicationId;
    }

    const [total, logs] = await Promise.all([
      prisma.liaisoningAuditLog.count({ where }),
      prisma.liaisoningAuditLog.findMany({
        where,
        include: {
          actor: {
            select: { id: true, fullName: true, email: true },
          },
          application: {
            include: {
              customer: {
                select: { id: true, fullName: true, phoneNumber: true, consumerNumber: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all follow-ups across applications
   */
  static async getFollowUps(filters?: { status?: string; limit?: number; page?: number }) {
    const customerIds = await this.getConvertedCustomerIds();
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      application: { customerId: { in: customerIds } },
    };
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    const [total, followUps] = await Promise.all([
      prisma.liaisoningFollowUp.count({ where }),
      prisma.liaisoningFollowUp.findMany({
        where,
        include: {
          application: {
            include: {
              customer: {
                select: { id: true, fullName: true, phoneNumber: true, consumerNumber: true, fullAddress: true },
              },
            },
          },
        },
        orderBy: { followUpDate: "asc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      followUps,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all documents across applications
   */
  static async getDocuments(filters?: { status?: string; documentType?: string; query?: string; limit?: number; page?: number }) {
    const customerIds = await this.getConvertedCustomerIds();
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      application: { customerId: { in: customerIds } },
    };
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }
    if (filters?.documentType && filters.documentType !== "ALL") {
      where.documentType = filters.documentType;
    }
    if (filters?.query) {
      where.AND = [
        {
          OR: [
            { title: { contains: filters.query, mode: "insensitive" } },
            { fileName: { contains: filters.query, mode: "insensitive" } },
            { application: { customer: { fullName: { contains: filters.query, mode: "insensitive" } } } },
          ],
        },
      ];
    }

    const [total, documents] = await Promise.all([
      prisma.liaisoningDocument.count({ where }),
      prisma.liaisoningDocument.findMany({
        where,
        include: {
          application: {
            include: {
              customer: {
                select: { id: true, fullName: true, phoneNumber: true, consumerNumber: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      documents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Verify or reject a document
   */
  static async verifyDocument(documentId: string, actorId: string, data: { status: string; remarks?: string }) {
    const doc = await prisma.liaisoningDocument.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new Error("Document not found");

    const updated = await prisma.liaisoningDocument.update({
      where: { id: documentId },
      data: {
        status: data.status,
        verifiedBy: actorId,
        verifiedAt: new Date(),
        verificationRemarks: data.remarks || null,
      },
    });

    await this.logAuditLog(
      doc.applicationId,
      actorId,
      "DOCUMENT_VERIFIED",
      `Document "${doc.title}" verified as ${data.status}`,
      { documentId, status: data.status, remarks: data.remarks }
    );

    return updated;
  }

  /**
   * Get customers eligible to have a liaisoning application initialized
   */
  static async getEligibleCustomers(query?: string) {
    const customerIds = await this.getConvertedCustomerIds();

    const existingApps = await prisma.liaisoningApplication.findMany({
      where: { customerId: { in: customerIds } },
      select: { customerId: true },
    });
    const existingAppCustomerIds = existingApps.map((a) => a.customerId);

    const where: any = {
      id: { in: customerIds, notIn: existingAppCustomerIds },
    };

    if (query) {
      where.AND = [
        {
          OR: [
            { fullName: { contains: query, mode: "insensitive" } },
            { phoneNumber: { contains: query, mode: "insensitive" } },
            { consumerNumber: { contains: query, mode: "insensitive" } },
          ],
        },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        consumerNumber: true,
        address: true,
        city: true,
        systemSizeKw: true,
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    return customers.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      phoneNumber: c.phoneNumber,
      consumerNumber: c.consumerNumber,
      address: c.address,
      fullAddress: c.address,
      city: c.city,
      systemSizeKw: c.systemSizeKw,
      systemCapacityKw: c.systemSizeKw,
      discomName:
        c.city?.toLowerCase().includes("gujarat") || c.city?.toLowerCase().includes("ahmedabad")
          ? "Torrent Power"
          : "MSEDCL",
    }));
  }
}

export { upload };
