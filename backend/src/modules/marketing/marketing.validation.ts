/**
 * Marketing Lead & Client Normalization and Validation Utilities
 */

/**
 * Normalizes an Indian phone number:
 * - Strips all non-digit characters
 * - Strips leading +91 or 91 if 12 digits
 * - Strips leading 0 if 11 digits
 * - Returns a clean 10-digit string if valid Indian mobile (starts with 6-9), otherwise null
 */
export function normalizePhoneNumber(rawPhone?: string | null): { normalized: string; isValid: boolean; error?: string } {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { normalized: "", isValid: false, error: "Mobile number is required" };
  }

  // Strip all non-digit characters
  let digits = rawPhone.replace(/\D/g, "");

  // Handle +91 or 91 prefix
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }
  // Handle leading 0 prefix
  else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) {
    return {
      normalized: digits,
      isValid: false,
      error: `Mobile number must be exactly 10 digits (got ${digits.length} digits)`,
    };
  }

  // Must start with 6, 7, 8, or 9 for Indian mobile numbers
  if (!/^[6-9]/.test(digits)) {
    return {
      normalized: digits,
      isValid: false,
      error: "Indian mobile number must start with 6, 7, 8, or 9",
    };
  }

  return { normalized: digits, isValid: true };
}

/**
 * Normalizes an email address:
 * - Trims and lowercases
 * - Validates format
 */
export function normalizeEmail(rawEmail?: string | null): { normalized: string | null; isValid: boolean; error?: string } {
  if (!rawEmail || typeof rawEmail !== "string") {
    return { normalized: null, isValid: true };
  }

  const trimmed = rawEmail.trim().toLowerCase();
  if (!trimmed) {
    return { normalized: null, isValid: true };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { normalized: trimmed, isValid: false, error: "Invalid email format" };
  }

  return { normalized: trimmed, isValid: true };
}

/**
 * Normalizes text (Name, Address):
 * - Trims whitespace
 * - Collapses consecutive spaces into one
 */
export function normalizeText(rawText?: string | null): string {
  if (!rawText || typeof rawText !== "string") return "";
  return rawText.trim().replace(/\s+/g, " ");
}

/**
 * Key for comparing name + address to detect duplicates even with slightly different formats
 */
export function getAddressFuzzyKey(name: string, address: string): string {
  const normName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normAddr = address.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${normName}__${normAddr}`;
}

