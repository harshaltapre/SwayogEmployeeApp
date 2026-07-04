export const SERVICE_OPTIONS = [
  "General Maintenance",
  "Panel Cleaning",
  "Inverter Issue",
  "App/Monitoring Issue",
  "Car cleaning",
  "Other",
] as const;

export type ServiceOption = (typeof SERVICE_OPTIONS)[number];

const EMPLOYEE_SERVICES_STORAGE_KEY = "swayog_employee_services";

function readStorageMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(EMPLOYEE_SERVICES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    const out: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(value)) continue;
      out[key] = value
        .map((item) => String(item).trim())
        .filter(Boolean);
    }
    return out;
  } catch {
    return {};
  }
}

function writeStorageMap(map: Record<string, string[]>): void {
  localStorage.setItem(EMPLOYEE_SERVICES_STORAGE_KEY, JSON.stringify(map));
}

export function getEmployeeServicesMap(): Record<string, string[]> {
  return readStorageMap();
}

export function setEmployeeServices(userId: string, services: string[]): void {
  const key = String(userId).trim();
  if (!key) return;

  const sanitized = Array.from(new Set(services.map((service) => service.trim()).filter(Boolean)));
  const existing = readStorageMap();
  existing[key] = sanitized;
  writeStorageMap(existing);
}

export function getMatchedEmployeeIds(issueType: string): string[] {
  const normalized = issueType.trim().toLowerCase();
  if (!normalized) return [];

  const map = readStorageMap();
  return Object.entries(map)
    .filter(([, services]) =>
      services.some((service) => service.trim().toLowerCase() === normalized),
    )
    .map(([userId]) => userId);
}
