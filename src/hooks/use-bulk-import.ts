/**
 * Bulk Import Hooks
 * Handles bulk creation of users from validated data
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateInternalUser,
  useCreateCustomer,
  type EmployeeRecord,
  type CustomerRecord,
  type CreateInternalUserInput,
  type CreateCustomerInput,
} from "@/lib/api-client";
import type {
  ValidatedEmployeeData,
  ValidatedCustomerData,
  ValidatedPartnerData,
} from "@/lib/excel-parser";

/**
 * Hook for bulk importing employees
 */
export function useBulkEmployeeImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: createEmployee } = useCreateInternalUser();

  return useMutation({
    mutationFn: async (employees: ValidatedEmployeeData[]) => {
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as Array<{ row: number; fullName: string; error: string }>,
      };

      for (const employee of employees) {
        try {
          // Generate a secure password (can be replaced with backend logic)
          const generatedPassword = generateSecurePassword(12);

          const input: CreateInternalUserInput = {
            fullName: employee.fullName,
            email: employee.email,
            phoneNumber: employee.phoneNumber,
            password: generatedPassword,
            role: mapJobRoleToRole(employee.jobRole),
          };

          await createEmployee({ data: input });
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: employee.rowNumber,
            fullName: employee.fullName,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["admin-employees"] });

      if (results.successful > 0) {
        toast({
          title: "Import Successful",
          description: `${results.successful} employee(s) imported successfully.`,
          variant: "default",
        });
      }

      if (results.failed > 0) {
        toast({
          title: "Import Completed with Errors",
          description: `${results.failed} employee(s) failed to import. Please review the errors.`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description:
          error instanceof Error ? error.message : "Failed to import employees",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for bulk importing customers
 */
export function useBulkCustomerImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: createCustomer } = useCreateCustomer();

  return useMutation({
    mutationFn: async (customers: ValidatedCustomerData[]) => {
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as Array<{ row: number; fullName: string; error: string }>,
      };

      for (const customer of customers) {
        try {
          const input: CreateCustomerInput = {
            fullName: customer.fullName,
            email: customer.email,
            phoneNumber: customer.phoneNumber,
            city: customer.city,
            address: customer.address,
            systemSizeKw: customer.systemSizeKw,
            installationDate: formatDate(customer.installationDate),
            panelBrand: customer.panelBrand,
            inverterBrand: customer.inverterBrand,
            inverterLoginId: customer.inverterLoginId,
            inverterPassword: customer.inverterPassword,
            inverterApiKey: customer.inverterApiKey,
            inverterModel: customer.inverterModel,
            contractStartDate: customer.contractStartDate ? formatDate(customer.contractStartDate) : undefined,
            cleaningsPerMonth: customer.cleaningsPerMonth,
            status: "active",
            amcStatus: (customer.amcStatus === "active" || customer.amcStatus === "expired") ? customer.amcStatus : "none",
            monthlyCleaningRate: customer.monthlyCleaningRate,
            paymentTerms: customer.paymentTerms,
            remarks: customer.remarks,
          };

          await createCustomer({ data: input });
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: customer.rowNumber,
            fullName: customer.fullName,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      queryClient.invalidateQueries({ queryKey: ["amc-customers"] });

      if (results.successful > 0) {
        toast({
          title: "Import Successful",
          description: `${results.successful} customer(s) imported successfully.`,
          variant: "default",
        });
      }

      if (results.failed > 0) {
        toast({
          title: "Import Completed with Errors",
          description: `${results.failed} customer(s) failed to import. Please review the errors.`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description:
          error instanceof Error ? error.message : "Failed to import customers",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for bulk importing partners (placeholder)
 */
export function useBulkPartnerImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: createPartner } = useCreateInternalUser();

  return useMutation({
    mutationFn: async (partners: ValidatedPartnerData[]) => {
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as Array<{ row: number; name: string; error: string }>,
      };

      for (const partner of partners) {
        try {
          const generatedPassword = generateSecurePassword(12);

          const input: CreateInternalUserInput = {
            fullName: partner.companyName,
            email: partner.email,
            phoneNumber: partner.phoneNumber,
            password: generatedPassword,
            role: "PARTNER",
            businessName: partner.companyName,
            zone: partner.zone,
          };

          await createPartner({ data: input });
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: partner.rowNumber,
            name: partner.companyName,
            error: error instanceof Error ? error.message : "Registration failed",
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });

      if (results.successful > 0) {
        toast({
          title: "Import Successful",
          description: `${results.successful} partner(s) imported successfully.`,
          variant: "default",
        });
      }

      if (results.failed > 0) {
        toast({
          title: "Import Completed with Errors",
          description: `${results.failed} partner(s) failed to import.`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description:
          error instanceof Error ? error.message : "Failed to import partners",
        variant: "destructive",
      });
    },
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Generate a secure random password
 */
function generateSecurePassword(length: number): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  // Ensure at least one uppercase, one lowercase, one number, one special char
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  password += "0123456789"[Math.floor(Math.random() * 10)];
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/**
 * Map job role to internal user role
 */
function mapJobRoleToRole(
  jobRole: string
): "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE" | "PARTNER" {
  const roleMap: Record<string, "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE" | "PARTNER"> = {
    field_technician: "EMPLOYEE",
    supervisor: "ADMIN",
    manager: "ADMIN",
    admin: "ADMIN",
    employee: "EMPLOYEE",
    technician: "EMPLOYEE",
    partner: "PARTNER",
  };

  return roleMap[jobRole.toLowerCase()] || "EMPLOYEE";
}

/**
 * Format date string to YYYY-MM-DD
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split("T")[0];
    }
    return date.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}
