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
    "Customer Name", "Site Location", "Phone", "Email", "City", "Plant Size (kW)", 
    "Installation Date", "AMC Status", "Contract Start", "Cleanings / Month", 
    "Inverter Brand", "Inverter Login ID", "Password", "API Key / Plant ID", 
    "Status (Online/Offline)", "Inverter Model", "NO of Cleaning", "Monthly Rate (₹)", 
    "Payment Terms", "Remarks"
  ];
  
  const data = customers.map(c => ({
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
    "Password": c.inverterPassword || c.portalPassword || "",
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
