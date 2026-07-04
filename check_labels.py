import re
import sys

files = [
    "./security-settings.html",
    "./security-settings-premium.html",
    "./src/pages/partner/Settings.tsx",
    "./src/pages/employee/Settings.tsx",
    "./src/pages/employee/SubAdminComplaints.tsx",
    "./src/pages/Login.tsx",
    "./src/pages/admin/EmployeeWorkLogs.tsx",
    "./src/pages/admin/Settings.tsx",
    "./src/pages/admin/AdminInventoryFormModal.tsx",
    "./src/pages/inventory/InventoryCustomers.tsx",
    "./src/pages/superadmin/SettingsTab.tsx",
    "./src/pages/superadmin/InventoryFormModal.tsx",
    "./src/pages/superadmin/UsersTab.tsx",
    "./src/pages/customer/Settings.tsx",
    "./src/pages/customer/Service.tsx",
    "./src/components/customers/ServiceRequestForm.tsx",
    "./src/components/ExcelImportDialog.tsx",
    "./src/components/subadmin/ServiceRequestsPanel.tsx",
    "./src/components/subadmin/AmcVisitTracker.tsx"
]

for file_path in files:
    try:
        with open(file_path, 'r') as f:
            content = f.read()
            # Simple count - note this might miss complex cases (e.g. comments, strings)
            # but it is a good heuristic.
            open_tags = len(re.findall(r'<label\b', content))
            close_tags = len(re.findall(r'</label>', content))
            
            if open_tags != close_tags:
                print(f"File: {file_path}")
                print(f"  Open <label>: {open_tags}")
                print(f"  Close </label>: {close_tags}")
                # Find the lines where labels occur
                lines = content.splitlines()
                for i, line in enumerate(lines):
                    if '<label' in line or '</label>' in line:
                         print(f"    {i+1}: {line.strip()}")
                print("-" * 20)
    except Exception as e:
        print(f"Could not read {file_path}: {e}")
