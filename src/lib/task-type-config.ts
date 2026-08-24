export type TaskTypeKey = "AMC_VISIT" | "SITE_VISIT" | "REGULAR";

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
    sitePhotoMax: 10,
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
  maintenance: "AMC_VISIT",
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

  if (normalizedJobType.includes("amc")) {
    return "AMC_VISIT";
  }

  if (normalizedJobType.includes("sitevisit") || normalizedJobType.includes("sitesurvey") || normalizedJobType.includes("survey")) {
    return "SITE_VISIT";
  }

  if (
    normalizedJobType.includes("cleaning") ||
    normalizedJobType.includes("maintenance") ||
    normalizedJobType.includes("service") ||
    normalizedJobType.includes("installation") ||
    normalizedJobType.includes("complaint")
  ) {
    return "AMC_VISIT";
  }

  return "REGULAR";
}

export function getTaskTypeConfig(task: { taskType?: string | null; jobType?: string | null }): TaskTypeConfig {
  return TASK_TYPE_CONFIG[resolveTaskType(task.taskType, task.jobType)];
}
