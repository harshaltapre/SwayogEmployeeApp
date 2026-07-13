import React from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getRoleDashboardPath, useAuth } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import NotFound from "@/pages/not-found";
import Home from "@/pages/public/Home";
import Login from "@/pages/Login";

import SuperAdminDashboard from "@/pages/superadmin/SuperAdminDashboard";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminCustomers from "@/pages/admin/Customers";
import AdminCustomerDetail from "@/pages/admin/CustomerDetail";
import AdminEmployees from "@/pages/admin/Employees";
import AdminEmployeeDetail from "@/pages/admin/EmployeeDetail";
import AdminPartners from "@/pages/admin/Partners";
import AdminComplaints from "@/pages/admin/Complaints";
import AdminInventory from "@/pages/admin/Inventory";
import AdminFinancials from "@/pages/admin/Financials";
import AdminSettings from "@/pages/admin/Settings";

import EmployeeDashboard from "@/pages/employee/Dashboard";
import EmployeeTasks from "@/pages/employee/Tasks";
import EmployeeAttendance from "@/pages/employee/Attendance";
import Settings from "@/pages/employee/Settings";
import EmployeeProfile from "@/pages/employee/Profile";
import EmployeesUnderMe from "@/pages/employee/EmployeesUnderMe";
import DailyCommit from "@/pages/employee/DailyCommit";
import DailyCommitTracking from "@/pages/employee/DailyCommitTracking";

import PartnerDashboard from "@/pages/partner/Dashboard";
import PartnerProjects from "@/pages/partner/Projects";
import PartnerEarnings from "@/pages/partner/Earnings";
import PartnerMessages from "@/pages/partner/Messages";
import PartnerSettings from "@/pages/partner/Settings";

import CustomerDashboard from "@/pages/customer/Dashboard";
import CustomerInstallation from "@/pages/customer/Installation";
import CustomerService from "@/pages/customer/Service";
import CustomerPayments from "@/pages/customer/Payments";
import CustomerSettings from "@/pages/customer/Settings";

import SubAdminDashboard from "@/pages/employee/SubAdminDashboard";
import SubAdminComplaints from "@/pages/employee/SubAdminComplaints";
import SubAdminEmployees from "@/pages/employee/SubAdminEmployees";
import AmcManagement from "@/pages/employee/AmcManagement";
import SubAdminCalendar from "@/pages/employee/SubAdminCalendar";
import SubAdminFinancials from "@/pages/employee/SubAdminFinancials";
import WaareeSolarDashboard from "@/pages/employee/WaareeSolarDashboard";
import SubAdminCustomers from "@/pages/employee/SubAdminCustomers";



import InventoryExecutiveDashboard from "@/pages/inventory/Dashboard";
import InventoryManagementPage from "@/pages/inventory/Inventory";
import InventoryCustomers from "@/pages/inventory/InventoryCustomers";
import InventorySettingsPage from "@/pages/inventory/Settings";


const MockAdminPartnerDetail = () => <div>Partner Detail</div>;
const MockAdminComplaintDetail = () => <div>Complaint Detail</div>;
const MockEmployeeTaskDetail = () => <div>Task Detail</div>;

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, allowedRoles, path }: { component: any, allowedRoles: string[], path: string }) {
  const { user, token } = useAuth();
  
  return (
    <Route path={path}>
      {(params) => {
        if (!token || !user) {
          return <Redirect to="/login" />;
        }
        
        if (!allowedRoles.includes(user.role)) {
          return <Redirect to={getRoleDashboardPath(user.role, user.jobRole)} />;
        }
        
        return (
          <ErrorBoundary key={path}>
            <Component params={params} />
          </ErrorBoundary>
        );
      }}
    </Route>
  );
}


function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/about" component={() => <div className="p-8 text-center mt-20 text-2xl font-bold">About Page (Coming Soon)</div>} />
      <Route path="/services" component={() => <div className="p-8 text-center mt-20 text-2xl font-bold">Services Page (Coming Soon)</div>} />
      <Route path="/contact" component={() => <div className="p-8 text-center mt-20 text-2xl font-bold">Contact Page (Coming Soon)</div>} />
      <Route path="/login" component={Login} />

      {/* Super Admin Routes */}
      <ProtectedRoute path="/super-admin/dashboard" component={SuperAdminDashboard} allowedRoles={['super_admin']} />

      {/* Admin Routes */}
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} allowedRoles={['admin', 'super_admin']} />
      <ProtectedRoute path="/admin/customers" component={AdminCustomers} allowedRoles={['admin', 'super_admin']} />
      <ProtectedRoute path="/admin/customers/:id" component={AdminCustomerDetail} allowedRoles={['admin', 'super_admin']} />
      <ProtectedRoute path="/admin/employees" component={AdminEmployees} allowedRoles={['admin', 'super_admin']} />
      <ProtectedRoute path="/admin/employees/:id" component={AdminEmployeeDetail} allowedRoles={['admin', 'super_admin']} />
      <ProtectedRoute path="/admin/partners" component={AdminPartners} allowedRoles={['admin', 'super_admin']} />
      <ProtectedRoute path="/admin/partners/:id" component={MockAdminPartnerDetail} allowedRoles={['admin', 'super_admin']} />
      <ProtectedRoute path="/admin/complaints" component={AdminComplaints} allowedRoles={['admin', 'super_admin']} />
      <ProtectedRoute path="/admin/complaints/:id" component={MockAdminComplaintDetail} allowedRoles={['admin', 'super_admin']} />
      <ProtectedRoute path="/admin/inventory" component={AdminInventory} allowedRoles={['admin', 'super_admin']} />
      <ProtectedRoute path="/admin/financials" component={AdminFinancials} allowedRoles={['admin', 'super_admin']} />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} allowedRoles={['admin', 'super_admin']} />
      <ProtectedRoute path="/admin/daily-commits" component={DailyCommitTracking} allowedRoles={['admin', 'super_admin']} />
      
      {/* Employee Routes */}
      <ProtectedRoute path="/employee/dashboard" component={EmployeeDashboard} allowedRoles={['admin', 'super_admin', 'employee', 'team_lead', 'department_head']} />
      <ProtectedRoute path="/employee/profile" component={EmployeeProfile} allowedRoles={['admin', 'super_admin', 'employee', 'team_lead', 'department_head']} />
      <ProtectedRoute path="/employee/tasks" component={EmployeeTasks} allowedRoles={['admin', 'super_admin', 'employee', 'team_lead', 'department_head']} />
      <ProtectedRoute path="/employee/under-me" component={EmployeesUnderMe} allowedRoles={['admin', 'super_admin', 'employee', 'team_lead', 'department_head']} />
      <ProtectedRoute path="/employee/tasks/:id" component={MockEmployeeTaskDetail} allowedRoles={['admin', 'super_admin', 'employee', 'team_lead', 'department_head']} />
      <ProtectedRoute path="/employee/attendance" component={EmployeeAttendance} allowedRoles={['admin', 'super_admin', 'employee', 'team_lead', 'department_head']} />
      <ProtectedRoute path="/employee/daily-commit" component={DailyCommit} allowedRoles={['admin', 'super_admin', 'employee', 'sub_admin', 'team_lead', 'department_head']} />
      <ProtectedRoute path="/employee/daily-commits/team" component={DailyCommitTracking} allowedRoles={['admin', 'super_admin', 'employee', 'sub_admin', 'team_lead', 'department_head']} />
      <ProtectedRoute path="/employee/settings" component={Settings} allowedRoles={['admin', 'super_admin', 'employee', 'team_lead', 'department_head']} />
      
      {/* Sub Admin Specific Dashboard (for old employee+jobRole path) */}
      <ProtectedRoute path="/sub-admin/complaints" component={SubAdminComplaints} allowedRoles={['employee', 'sub_admin', 'admin', 'super_admin']} />
      
      {/* Partner Routes */}
      <ProtectedRoute path="/partner/dashboard" component={PartnerDashboard} allowedRoles={['admin', 'super_admin', 'partner']} />
      <ProtectedRoute path="/partner/projects" component={PartnerProjects} allowedRoles={['admin', 'super_admin', 'partner']} />
      <ProtectedRoute path="/partner/earnings" component={PartnerEarnings} allowedRoles={['admin', 'super_admin', 'partner']} />
      <ProtectedRoute path="/partner/messages" component={PartnerMessages} allowedRoles={['admin', 'super_admin', 'partner']} />
      <ProtectedRoute path="/partner/settings" component={PartnerSettings} allowedRoles={['admin', 'super_admin', 'partner']} />
      
      {/* Customer Routes */}
      <ProtectedRoute path="/customer/dashboard" component={CustomerDashboard} allowedRoles={['admin', 'super_admin', 'customer']} />
      <ProtectedRoute path="/customer/installation" component={CustomerInstallation} allowedRoles={['admin', 'super_admin', 'customer']} />
      <ProtectedRoute path="/customer/service" component={CustomerService} allowedRoles={['admin', 'super_admin', 'customer']} />
      <ProtectedRoute path="/customer/payments" component={CustomerPayments} allowedRoles={['admin', 'super_admin', 'customer']} />
      <ProtectedRoute path="/customer/settings" component={CustomerSettings} allowedRoles={['admin', 'super_admin', 'customer']} />
      
      {/* Sub Admin Routes */}
      <ProtectedRoute path="/subadmin/dashboard" component={SubAdminDashboard} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
      <ProtectedRoute path="/subadmin/customers" component={SubAdminCustomers} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
      <ProtectedRoute path="/subadmin/customers/:id" component={AdminCustomerDetail} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
      <ProtectedRoute path="/subadmin/complaints" component={SubAdminComplaints} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
      <ProtectedRoute path="/subadmin/employees" component={SubAdminEmployees} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
      <ProtectedRoute path="/subadmin/amc-management" component={AmcManagement} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
      <ProtectedRoute path="/subadmin/calendar" component={SubAdminCalendar} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
      <ProtectedRoute path="/subadmin/financials" component={SubAdminFinancials} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
      <ProtectedRoute path="/subadmin/waaree-solar" component={WaareeSolarDashboard} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />

      {/* Legacy compatibility redirect */}
      <Route path="/subadmin/service-requests">
        <Redirect to="/subadmin/complaints" />
      </Route>

      {/* Inventory Executive Routes */}
      <ProtectedRoute path="/inventory/dashboard" component={InventoryExecutiveDashboard} allowedRoles={['admin', 'super_admin', 'employee']} />
      <ProtectedRoute path="/inventory/inventory" component={InventoryManagementPage} allowedRoles={['admin', 'super_admin', 'employee']} />
      <ProtectedRoute path="/inventory/customers" component={InventoryCustomers} allowedRoles={['admin', 'super_admin', 'employee']} />
      <ProtectedRoute path="/inventory/settings" component={InventorySettingsPage} allowedRoles={['admin', 'super_admin', 'employee']} />

      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
