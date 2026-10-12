export type TaskTypeKey = "AMC_VISIT" | "SITE_VISIT" | "MAINTENANCE_VISIT" | "REGULAR";

export type TaskTypeConfig = {
  key: TaskTypeKey;
  label: string;
  requiresBeforeImage: boolean;
  requiresAfterImage: boolean;
  sitePhotoMin: number | null;
  sitePhotoMax: number | null;
};

export const TASK_TYPE_CONFIG: Record<TaskTypeKey, TaskTypeConfig> = {
  AMC_VISIT: {
    key: "AMC_VISIT",
    label: "AMC / Cleaning",
    requiresBeforeImage: true,
    requiresAfterImage: true,
    sitePhotoMin: null,
    sitePhotoMax: null,
  },
  SITE_VISIT: {
    key: "SITE_VISIT",
    label: "Site Visit",
    requiresBeforeImage: false,
    requiresAfterImage: false,
    sitePhotoMin: 4,
    sitePhotoMax: null,
  },
  MAINTENANCE_VISIT: {
    key: "MAINTENANCE_VISIT",
    label: "Maintenance Visit",
    requiresBeforeImage: false,
    requiresAfterImage: false,
    sitePhotoMin: 2,
    sitePhotoMax: null,
  },
  REGULAR: {
    key: "REGULAR",
    label: "Regular Task",
    requiresBeforeImage: false,
    requiresAfterImage: false,
    sitePhotoMin: null,
    sitePhotoMax: null,
  },
};

const explicitTypeAliases: Record<string, TaskTypeKey> = {
  amc: "AMC_VISIT",
  amcvisit: "AMC_VISIT",
  amcmaintenance: "AMC_VISIT",
  amcmaintenancevisit: "AMC_VISIT",
  cleaning: "AMC_VISIT",
  maintenancevisit: "MAINTENANCE_VISIT",
  maintenance_visit: "MAINTENANCE_VISIT",
  service: "AMC_VISIT",
  installation: "AMC_VISIT",
  complaint: "AMC_VISIT",
  sitevisit: "SITE_VISIT",
  sitesurvey: "SITE_VISIT",
  survey: "SITE_VISIT",
  regular: "REGULAR",
};

function normalize(value?: string | null): string {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function resolveTaskType(taskType?: string | null, jobType?: string | null): TaskTypeKey {
  const explicit = normalize(taskType);
  if (explicit && explicitTypeAliases[explicit]) {
    return explicitTypeAliases[explicit];
  }

  const normalizedJobType = normalize(jobType);
  if (!normalizedJobType) {
    return "REGULAR";
  }

  // Check for maintenance visit first (before general maintenance)
  if (normalizedJobType.includes("maintenancevisit") || normalizedJobType.includes("maintenance visit")) {
    return "MAINTENANCE_VISIT";
  }

  if (normalizedJobType.includes("amc")) {
    return "AMC_VISIT";
  }

  if (normalizedJobType.includes("sitevisit") || normalizedJobType.includes("sitesurvey") || normalizedJobType.includes("survey")) {
    return "SITE_VISIT";
  }

  if (
    normalizedJobType.includes("cleaning") ||
    normalizedJobType.includes("service") ||
    normalizedJobType.includes("installation") ||
    normalizedJobType.includes("complaint")
  ) {
    return "AMC_VISIT";
  }

  return "REGULAR";
}

export function getTaskTypeConfig(taskType?: string | null, jobType?: string | null): TaskTypeConfig {
  return TASK_TYPE_CONFIG[resolveTaskType(taskType, jobType)];
}
