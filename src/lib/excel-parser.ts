/**
 * Excel Parser Utility
 * Handles parsing and validation of Excel files for bulk data import
 */

// Use dynamic import wrapper for xlsx
let XLSX: any = null;

async function getXLSX() {
  if (!XLSX) {
    XLSX = await import('xlsx');
  }
  return XLSX;
}

/**
 * Parse Excel file using the Blob API
 * Supports .xlsx and .xls files
 */
export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Import xlsx library
    const xlsxModule = await getXLSX();
    
    // Parse the workbook
    const workbook = xlsxModule.read(arrayBuffer, { type: 'array' });
    
    if (!workbook.SheetNames.length) {
      return {
        success: false,
        error: 'Excel file contains no sheets',
        sheets: [],
        data: []
      };
    }
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = xlsxModule.utils.sheet_to_json(worksheet);
    
    return {
      success: true,
      sheets: workbook.SheetNames,
      data: data as Record<string, unknown>[],
      error: null
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      sheets: [],
      data: []
    };
  }
}

/**
 * Validate employee data from Excel
 */
export function validateEmployeeData(rows: Record<string, unknown>[]): ValidatedEmployeeData[] {
  return rows.map((row, index) => {
    const errors: string[] = [];
    const fullName = String(row['Full Name'] || row['fullName'] || '').trim();
    const email = String(row['Email'] || row['email'] || '').trim();
    const phoneNumber = String(row['Phone'] || row['phoneNumber'] || row['Phone Number'] || '').trim();
    const jobRole = String(row['Job Role'] || row['jobRole'] || row['Role'] || 'field_technician').trim();
    const zone = String(row['Zone'] || row['zone'] || '').trim();
    const monthlySalaryInr = parseFloat(String(row['Monthly Salary'] || row['monthlySalaryInr'] || row['Salary'] || '0'));

    // Validation
    if (!fullName) errors.push('Full Name is required');
    if (!email) errors.push('Email is required');
    else if (!isValidEmail(email)) errors.push('Invalid email format');
    if (!phoneNumber) errors.push('Phone number is required');
    else if (phoneNumber.length < 8) errors.push('Phone must be at least 8 characters');
    if (!jobRole) errors.push('Job Role is required');
    if (!zone) errors.push('Zone is required');
    if (isNaN(monthlySalaryInr) || monthlySalaryInr <= 0) errors.push('Valid salary is required');

    return {
      rowNumber: index + 2, // +2 because first row is header and 1-indexed
      fullName,
      email,
      phoneNumber,
      jobRole,
      zone,
      monthlySalaryInr,
      isValid: errors.length === 0,
      errors
    };
  });
}

/**
 * Validate customer data from Excel
 */
export function validateCustomerData(rows: Record<string, unknown>[]): ValidatedCustomerData[] {
  return rows.map((row, index) => {
    const errors: string[] = [];
    const customerCode = String(row['Customer ID'] || row['Customer Code'] || row['customerCode'] || '').trim() || undefined;
    const fullName = String(row['Customer Name'] || row['Customer Name *'] || row['Full Name'] || row['fullName'] || row['Name'] || '').trim();
    const address = String(row['Site Location'] || row['Site Location *'] || row['Address'] || row['address'] || '').trim();
    const phoneNumber = String(row['Phone'] || row['Phone *'] || row['phoneNumber'] || row['Phone Number'] || '').trim();
    const email = String(row['Email'] || row['email'] || '').trim();
    const city = String(row['City'] || row['City *'] || row['city'] || '').trim();
    const systemSizeKw = parseFloat(String(row['Plant Size (kW)'] || row['Plant Size (kW) *'] || row['System Size (kW)'] || row['systemSizeKw'] || row['System Size'] || '0'));
    const installationDate = String(row['Installation Date'] || row['installationDate'] || '').trim();
    const amcStatus = String(row['AMC Status'] || row['AMC Status *'] || row['amcStatus'] || 'none').trim().toLowerCase();
    
    // NEW AMC CONTRACT & CREDENTIALS FIELDS:
    const contractStartDate = String(row['Contract Start'] || row['Contract Start *'] || row['contractStartDate'] || '').trim();
    const cleaningsPerMonth = parseInt(String(row['NO of Cleaning'] || row['No of Cleanings'] || row['Cleanings / Month'] || row['Cleanings / Month *'] || row['Cleanings/Month'] || row['cleaningsPerMonth'] || '0')) || null;
    const inverterBrand = String(row['Inverter Brand'] || row['Inverter Brand *'] || row['inverterBrand'] || '').trim();
    const inverterLoginId = String(row['Inverter Login ID'] || row['Login id'] || row['inverterLoginId'] || '').trim();
    const inverterPassword = String(row['Password'] || row['inverterPassword'] || '').trim();
    const inverterApiKey = String(row['API Key / Plant ID'] || row['Api optional'] || row['inverterApiKey'] || '').trim();
    const inverterModel = String(row['Inverter Model'] || row['inverterModel'] || '').trim();
    const dataLoggerSrNo = String(row['Data Logger Sr No'] || row['Logger Sr No'] || row['dataLoggerSrNo'] || '').trim();
    const inverterSrNo = String(row['Inverter Sr No'] || row['Inverter Serial No'] || row['inverterSrNo'] || '').trim();
    const monthlyCleaningRate = parseFloat(String(row['Monthly Rate (₹)'] || row['Monthly Rate'] || row['monthlyCleaningRate'] || '0')) || null;
    const paymentTerms = String(row['Payment Terms'] || row['paymentTerms'] || '').trim() || null;
    const remarks = String(row['Remarks'] || row['remarks'] || '').trim() || null;

    // Validation
    if (!fullName) errors.push('Customer Name is required');
    if (!address) errors.push('Site Location is required');
    if (!phoneNumber) errors.push('Phone is required');
    else if (phoneNumber.length < 8) errors.push('Phone must be at least 8 characters');
    if (!city) errors.push('City is required');
    if (isNaN(systemSizeKw) || systemSizeKw <= 0) errors.push('Valid Plant Size (kW) is required');
    
    // Email is optional in template, but if provided, validate format
    if (email && !isValidEmail(email)) errors.push('Invalid email format');
    
    // Date formats
    if (installationDate && !isValidDate(installationDate)) {
      errors.push('Invalid installation date format (use YYYY-MM-DD)');
    }
    if (contractStartDate && !isValidDate(contractStartDate)) {
      errors.push('Invalid contract start date format (use YYYY-MM-DD)');
    }

    return {
      rowNumber: index + 2,
      customerCode,
      fullName,
      email: email || `${fullName.replace(/\s+/g, '').toLowerCase()}-${index}@swayog.in`, // Fallback email since it's optional in the excel sheet but required in DB/API
      phoneNumber,
      city,
      address,
      systemSizeKw,
      installationDate: installationDate || new Date().toISOString().split('T')[0], // Fallback to now if blank
      amcStatus: (amcStatus === 'active' || amcStatus === 'expired') ? amcStatus : 'none',
      contractStartDate: contractStartDate || undefined,
      cleaningsPerMonth: cleaningsPerMonth || 2,
      inverterBrand: inverterBrand || undefined,
      inverterLoginId: inverterLoginId || undefined,
      inverterPassword: inverterPassword || undefined,
      inverterApiKey: inverterApiKey || undefined,
      inverterModel: inverterModel || undefined,
      dataLoggerSrNo: dataLoggerSrNo || undefined,
      inverterSrNo: inverterSrNo || undefined,
      monthlyCleaningRate: monthlyCleaningRate || undefined,
      paymentTerms: paymentTerms || undefined,
      remarks: remarks || undefined,
      isValid: errors.length === 0,
      errors
    };
  });
}

/**
 * Validate partner data from Excel
 */
export function validatePartnerData(rows: Record<string, unknown>[]): ValidatedPartnerData[] {
  return rows.map((row, index) => {
    const errors: string[] = [];
    const companyName = String(row['Company Name'] || row['companyName'] || row['Name'] || '').trim();
    const email = String(row['Email'] || row['email'] || '').trim();
    const phoneNumber = String(row['Phone'] || row['phoneNumber'] || row['Phone Number'] || '').trim();
    const zone = String(row['Zone'] || row['zone'] || '').trim();
    const commission = parseFloat(String(row['Commission %'] || row['commission'] || row['Commission'] || '5'));

    // Validation
    if (!companyName) errors.push('Company Name is required');
    if (!email) errors.push('Email is required');
    else if (!isValidEmail(email)) errors.push('Invalid email format');
    if (!phoneNumber) errors.push('Phone number is required');
    else if (phoneNumber.length < 8) errors.push('Phone must be at least 8 characters');
    if (!zone) errors.push('Zone is required');
    if (isNaN(commission) || commission < 0 || commission > 100) errors.push('Commission must be between 0-100');

    return {
      rowNumber: index + 2,
      companyName,
      email,
      phoneNumber,
      zone,
      commission,
      isValid: errors.length === 0,
      errors
    };
  });
}

/**
 * Helper: Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper: Validate date format
 */
function isValidDate(dateString: string): boolean {
  // Accept various date formats: YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY
  const dateRegex = /^(\d{4}|\d{2})[-\/](\d{2})[-\/](\d{4}|\d{2})$/;
  if (!dateRegex.test(dateString)) return false;
  
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Generate sample Excel template
 */
export function generateEmployeeTemplate(): string {
  const headers = ['Full Name', 'Email', 'Phone Number', 'Job Role', 'Zone', 'Monthly Salary'];
  const sampleData = [
    ['Rajesh Kumar', 'rajesh.kumar@example.com', '9876543210', 'field_technician', 'Nashik', '20000'],
    ['Priya Singh', 'priya.singh@example.com', '9765432109', 'supervisor', 'Pune', '25000'],
    ['Amit Patel', 'amit.patel@example.com', '9654321098', 'field_technician', 'Mumbai', '20000'],
  ];
  
  const csv = [
    headers.join(','),
    ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csv;
}

export function generateCustomerTemplate(): string {
  const headers = ['Full Name', 'Email', 'Phone Number', 'City', 'Address', 'System Size (kW)', 'Installation Date', 'Panel Brand', 'Inverter Brand'];
  const sampleData = [
    ['Sharma Residence', 'sharma@example.com', '9876543210', 'Nashik', '123 Main Street, Nashik', '5', '2024-01-15', 'Longi', 'Sungrow'],
    ['Patel Commercial', 'patel@example.com', '9765432109', 'Pune', '456 Business Park, Pune', '10', '2024-02-20', 'JA Solar', 'Fronius'],
  ];
  
  const csv = [
    headers.join(','),
    ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csv;
}

export function generatePartnerTemplate(): string {
  const headers = ['Company Name', 'Email', 'Phone Number', 'Zone', 'Commission %'];
  const sampleData = [
    ['Solar Solutions Ltd', 'contact@solarsolutions.com', '9876543210', 'Nashik', '8'],
    ['Green Energy Partners', 'info@greenenergy.com', '9765432109', 'Pune', '10'],
  ];
  
  const csv = [
    headers.join(','),
    ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csv;
}

// Types
export type ExcelParseResult = {
  success: boolean;
  error: string | null;
  sheets: string[];
  data: Record<string, unknown>[];
};

export type ValidatedEmployeeData = {
  rowNumber: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  jobRole: string;
  zone: string;
  monthlySalaryInr: number;
  isValid: boolean;
  errors: string[];
};

export type ValidatedCustomerData = {
  rowNumber: number;
  customerCode?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  city: string;
  address: string;
  systemSizeKw: number;
  installationDate: string;
  panelBrand?: string;
  inverterBrand?: string;
  inverterModel?: string;
  inverterLoginId?: string;
  inverterPassword?: string;
  inverterApiKey?: string;
  dataLoggerSrNo?: string;
  inverterSrNo?: string;
  contractStartDate?: string;
  cleaningsPerMonth?: number;
  amcStatus?: string;
  monthlyCleaningRate?: number;
  paymentTerms?: string;
  remarks?: string;
  isValid: boolean;
  errors: string[];
};

export type ValidatedPartnerData = {
  rowNumber: number;
  companyName: string;
  email: string;
  phoneNumber: string;
  zone: string;
  commission: number;
  isValid: boolean;
  errors: string[];
};

/**
 * Dynamically exports a list of customers to a real Excel (.xlsx) file matching the import format
 */
export async function exportCustomersToExcel(customers: any[]): Promise<Blob> {
  const XLSX = await import('xlsx');
  const headers = [
    "Customer ID", "Customer Name", "Site Location", "Phone", "Email", "City", "Plant Size (kW)",
    "Installation Date", "AMC Status", "Contract Start", "Cleanings / Month", 
    "Inverter Brand", "Inverter Login ID", "Data Logger Sr No", "Inverter Sr No", "API Key / Plant ID",
    "Status (Online/Offline)", "Inverter Model", "NO of Cleaning", "Monthly Rate (₹)", 
    "Payment Terms", "Remarks"
  ];
  
  const data = customers.map(c => ({
    "Customer ID": c.customerCode || "",
    "Customer Name": c.name || c.fullName || "",
    "Site Location": c.address || "",
    "Phone": c.phone || c.phoneNumber || "",
    "Email": c.email || "",
    "City": c.city || "",
    "Plant Size (kW)": c.systemSizeKw || 0,
    "Installation Date": c.installationDate ? c.installationDate.split("T")[0] : "",
    "AMC Status": c.amcStatus || "none",
    "Contract Start": c.contractStartDate ? c.contractStartDate.split("T")[0] : "",
    "Cleanings / Month": c.cleaningsPerMonth || 2,
    "Inverter Brand": c.inverterBrand || "",
    "Inverter Login ID": c.inverterLoginId || c.portalLoginId || "",
    "Data Logger Sr No": c.dataLoggerSrNo || c.inverterUid || "",
    "Inverter Sr No": c.inverterSrNo || c.inverterDeviceSn || "",
    "API Key / Plant ID": c.inverterApiKey || "",
    "Status (Online/Offline)": c.status || "active",
    "Inverter Model": c.inverterModel || "",
    "NO of Cleaning": c.cleaningsPerMonth || 2,
    "Monthly Rate (₹)": c.monthlyCleaningRate || 0,
    "Payment Terms": c.paymentTerms || "",
    "Remarks": c.remarks || ""
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
  
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}


export type ValidatedMarketingLeadData = {
  rowNumber: number;
  name: string;
  phone: string;
  normalizedPhone: string;
  email?: string;
  address?: string;
  source: "Website" | "Campaign" | "Referral" | "Partner" | "Other";
  status: "New" | "Contacted" | "Qualified" | "Converted" | "Disqualified";
  assignedTo?: string;
  isValid: boolean;
  isDuplicate: boolean;
  duplicateReason?: string;
  matchedRecord?: string;
  errors: string[];
};

export interface ExistingClientRecords {
  phones?: Set<string>;
  emails?: Set<string>;
  nameAddrs?: Set<string>;
  phoneToName?: Map<string, string>;
  emailToName?: Map<string, string>;
}

export function normalizeIndianPhoneNumber(phone: string): { normalized: string; isValid: boolean } {
  let cleaned = String(phone || "").replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }
  const isValid = /^[6-9]\d{9}$/.test(cleaned);
  return { normalized: cleaned, isValid };
}

export function normalizeLeadEmail(email?: string): string {
  return String(email || "").trim().toLowerCase();
}

export function normalizeLeadText(text?: string): string {
  return String(text || "").trim().replace(/\s+/g, " ");
}

export function getLeadFuzzyKey(name: string, address: string): string {
  const normName = normalizeLeadText(name).toLowerCase();
  const normAddr = normalizeLeadText(address).toLowerCase();
  return `${normName}:::${normAddr}`;
}

/**
 * Validate marketing lead data from Excel / CSV with comprehensive validation and duplicate detection
 */
export function validateMarketingLeadData(
  rows: Record<string, unknown>[],
  existingRecords?: ExistingClientRecords
): ValidatedMarketingLeadData[] {
  // Track seen identifiers within the file for intra-sheet duplicate detection
  const seenPhones = new Map<string, { row: number; name: string }>();
  const seenEmails = new Map<string, { row: number; name: string }>();
  const seenNameAddrs = new Map<string, { row: number; name: string }>();

  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const errors: string[] = [];

    const rawName = String(row['Name'] || row['Name *'] || row['Contact Name'] || row['Lead Name'] || row['Full Name'] || row['name'] || '').trim();
    const rawPhone = String(row['Phone'] || row['Phone *'] || row['Phone Number'] || row['Mobile'] || row['phone'] || '').trim();
    const rawEmail = String(row['Email'] || row['Email Address'] || row['email'] || '').trim();
    const rawAddress = String(row['Address'] || row['Address *'] || row['Site Location'] || row['Location'] || row['City'] || row['address'] || '').trim();

    const name = normalizeLeadText(rawName);
    const email = normalizeLeadEmail(rawEmail);
    const address = normalizeLeadText(rawAddress);
    const { normalized: normalizedPhone, isValid: isPhoneValid } = normalizeIndianPhoneNumber(rawPhone);

    // Normalize source
    const sourceRaw = String(row['Source'] || row['Lead Source'] || row['source'] || 'Website').trim();
    const validSources = ["Website", "Campaign", "Referral", "Partner", "Other"] as const;
    const matchedSource = validSources.find(s => s.toLowerCase() === sourceRaw.toLowerCase()) || "Website";

    // Normalize status
    const statusRaw = String(row['Status'] || row['Lead Status'] || row['status'] || 'New').trim();
    const validStatuses = ["New", "Contacted", "Qualified", "Converted", "Disqualified"] as const;
    const matchedStatus = validStatuses.find(s => s.toLowerCase() === statusRaw.toLowerCase()) || "New";

    const assignedTo = String(row['Assigned To'] || row['Owner'] || row['assignedTo'] || '').trim() || undefined;

    // Field-level data validation
    if (!name) {
      errors.push('Client name cannot be empty');
    } else if (name.length < 2) {
      errors.push('Client name must be at least 2 characters');
    }

    if (!rawPhone) {
      errors.push('Mobile number is required');
    } else if (!isPhoneValid) {
      errors.push('Mobile number must be a valid 10-digit Indian number starting with 6-9');
    }

    if (!address) {
      errors.push('Address / Site Location cannot be empty');
    }

    if (email && !isValidEmail(email)) {
      errors.push('Email address format is invalid');
    }

    // Duplicate detection
    let isDuplicate = false;
    let duplicateReason: string | undefined;
    let matchedRecord: string | undefined;

    // 1. Check against existing CRM database records
    if (isPhoneValid && existingRecords?.phones?.has(normalizedPhone)) {
      isDuplicate = true;
      matchedRecord = existingRecords?.phoneToName?.get(normalizedPhone) || "Existing Client";
      duplicateReason = `Mobile number already exists in CRM (matches ${matchedRecord})`;
    } else if (email && existingRecords?.emails?.has(email)) {
      isDuplicate = true;
      matchedRecord = existingRecords?.emailToName?.get(email) || "Existing Client";
      duplicateReason = `Email already exists in CRM (matches ${matchedRecord})`;
    } else if (name && address && existingRecords?.nameAddrs?.has(getLeadFuzzyKey(name, address))) {
      isDuplicate = true;
      matchedRecord = "Existing Client";
      duplicateReason = "Client name and address already exist in CRM";
    }

    // 2. Check duplicates within the uploaded file
    if (!isDuplicate) {
      if (isPhoneValid) {
        if (seenPhones.has(normalizedPhone)) {
          const prev = seenPhones.get(normalizedPhone)!;
          isDuplicate = true;
          matchedRecord = prev.name || `Row #${prev.row}`;
          duplicateReason = `Duplicate mobile number in upload file (matches Row #${prev.row} - ${prev.name})`;
        } else {
          seenPhones.set(normalizedPhone, { row: rowNumber, name: name || 'Unnamed' });
        }
      }

      if (!isDuplicate && email) {
        if (seenEmails.has(email)) {
          const prev = seenEmails.get(email)!;
          isDuplicate = true;
          matchedRecord = prev.name || `Row #${prev.row}`;
          duplicateReason = `Duplicate email address in upload file (matches Row #${prev.row} - ${prev.name})`;
        } else {
          seenEmails.set(email, { row: rowNumber, name: name || 'Unnamed' });
        }
      }

      if (!isDuplicate && name && address) {
        const fuzzyKey = getLeadFuzzyKey(name, address);
        if (seenNameAddrs.has(fuzzyKey)) {
          const prev = seenNameAddrs.get(fuzzyKey)!;
          isDuplicate = true;
          matchedRecord = prev.name || `Row #${prev.row}`;
          duplicateReason = `Duplicate client name & address in upload file (matches Row #${prev.row} - ${prev.name})`;
        } else {
          seenNameAddrs.set(fuzzyKey, { row: rowNumber, name: name || 'Unnamed' });
        }
      }
    }

    const isValid = errors.length === 0 && !isDuplicate;

    return {
      rowNumber,
      name,
      phone: rawPhone,
      normalizedPhone: isPhoneValid ? normalizedPhone : rawPhone,
      email: email || undefined,
      address: address || undefined,
      source: matchedSource,
      status: matchedStatus,
      assignedTo,
      isValid,
      isDuplicate,
      duplicateReason,
      matchedRecord,
      errors
    };
  });
}

/**
 * Dynamically exports a list of marketing leads to a styled Excel (.xlsx) file
 */
export async function exportMarketingLeadsToExcel(leads: any[]): Promise<Blob> {
  const XLSX = await import('xlsx');
  const headers = [
    "Lead ID / Ref",
    "Contact Name",
    "Phone Number",
    "Email Address",
    "Address / Site Location",
    "Lead Source",
    "Status",
    "Assigned To",
    "Created Date",
    "Product / Details"
  ];

  const data = leads.map(l => ({
    "Lead ID / Ref": l.requestNumber || l.id || "",
    "Contact Name": l.name || "",
    "Phone Number": l.phone || "",
    "Email Address": l.email || "",
    "Address / Site Location": l.address || "",
    "Lead Source": l.source || "",
    "Status": l.statusLabel || l.status || "New",
    "Assigned To": l.assignedTo || "Unassigned",
    "Created Date": l.createdAt ? new Date(l.createdAt).toLocaleDateString("en-IN") : "",
    "Product / Details": l.requestedProduct || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 24 },
    { wch: 16 },
    { wch: 28 },
    { wch: 38 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 14 },
    { wch: 28 }
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Marketing Leads");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/**
 * Generates an Excel template for Marketing Leads bulk import
 */
export async function generateMarketingLeadTemplate(): Promise<Blob> {
  const XLSX = await import('xlsx');
  const sampleData = [
    {
      "Name *": "Rajesh Sharma",
      "Phone *": "9876543210",
      "Email": "rajesh.sharma@example.com",
      "Address": "Flat 402, Shivam Apts, Gangapur Road, Nashik",
      "Source": "Website",
      "Status": "New",
      "Assigned To": ""
    },
    {
      "Name *": "Sunita Deshmukh",
      "Phone *": "9823456789",
      "Email": "sunita.d@example.com",
      "Address": "Plot 15, MIDC Ambad, Nashik",
      "Source": "Referral",
      "Status": "Contacted",
      "Assigned To": "Yogesh Tayade"
    },
    {
      "Name *": "Amit Enterprises",
      "Phone *": "9822012345",
      "Email": "amit@enterprises.com",
      "Address": "Sector 18, Vashi, Navi Mumbai",
      "Source": "Partner",
      "Status": "Qualified",
      "Assigned To": ""
    }
  ];
  const headers = [
    "Name *",
    "Phone *",
    "Email",
    "Address",
    "Source",
    "Status",
    "Assigned To"
  ];
  const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
  worksheet['!cols'] = [
    { wch: 24 },
    { wch: 16 },
    { wch: 28 },
    { wch: 45 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 }
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads Template");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
