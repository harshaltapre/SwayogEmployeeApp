import React, { Suspense } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getFinanceLevel, getRoleDashboardPath, isEpcPartnerJobRole, isInstallationTeamJobRole, isLiaisoningEmployeeJobRole, isMarketingExecutiveJobRole, isMonitoringAnalystJobRole, isProjectCoordinatorJobRole, isServiceExecutiveHeadJobRole, useAuth } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuthProfileSync } from "@/hooks/use-auth-profile-sync";

// Direct imports for instant public entry points
import NotFound from "@/pages/not-found";
import Home from "@/pages/public/Home";
import Login from "@/pages/Login";

// Lazy-loaded routes for optimal bundle code-splitting
const SuperAdminDashboard = React.lazy(() => import("@/pages/superadmin/SuperAdminDashboard"));
const AdminDashboard = React.lazy(() => import("@/pages/admin/Dashboard"));
const AdminCustomers = React.lazy(() => import("@/pages/admin/Customers"));
const AdminCustomerOnboarding = React.lazy(() => import("@/pages/admin/CustomerOnboarding"));
const AdminCustomerDetail = React.lazy(() => import("@/pages/admin/CustomerDetail"));
const AdminEmployees = React.lazy(() => import("@/pages/admin/Employees"));
const AdminEmployeeDetail = React.lazy(() => import("@/pages/admin/EmployeeDetail"));
const AdminPartners = React.lazy(() => import("@/pages/admin/Partners"));
const AdminComplaints = React.lazy(() => import("@/pages/admin/Complaints"));
const AdminInventory = React.lazy(() => import("@/pages/admin/Inventory"));
const AdminFinancials = React.lazy(() => import("@/pages/admin/Financials"));
const AdminSettings = React.lazy(() => import("@/pages/admin/Settings"));
const AdminAttendance = React.lazy(() => import("@/pages/admin/Attendance"));
const IsphereGreenPage = React.lazy(() => import("@/pages/admin/isphere-green/IsphereGreenPage"));
const OnboardingOverview = React.lazy(() => import("@/pages/admin/onboarding/OnboardingOverview"));
const OnboardingRequests = React.lazy(() => import("@/pages/admin/onboarding/OnboardingRequests"));
const OnboardingRequestDetail = React.lazy(() => import("@/pages/admin/onboarding/OnboardingRequestDetail"));
const NewOnboardingRequest = React.lazy(() => import("@/pages/admin/onboarding/NewOnboardingRequest"));

const EmployeeDashboard = React.lazy(() => import("@/pages/employee/Dashboard"));
const EmployeeTasks = React.lazy(() => import("@/pages/employee/Tasks"));
const EmployeeAttendance = React.lazy(() => import("@/pages/employee/Attendance"));
const Settings = React.lazy(() => import("@/pages/employee/Settings"));
const EmployeeProfile = React.lazy(() => import("@/pages/employee/Profile"));
const EmployeesUnderMe = React.lazy(() => import("@/pages/employee/EmployeesUnderMe"));
const DailyCommit = React.lazy(() => import("@/pages/employee/DailyCommit"));
const DailyCommitTracking = React.lazy(() => import("@/pages/employee/DailyCommitTracking"));

const PartnerDashboard = React.lazy(() => import("@/pages/partner/Dashboard"));
const PartnerProjects = React.lazy(() => import("@/pages/partner/Projects"));
const PartnerEarnings = React.lazy(() => import("@/pages/partner/Earnings"));
const PartnerMessages = React.lazy(() => import("@/pages/partner/Messages"));
const PartnerSettings = React.lazy(() => import("@/pages/partner/Settings"));

const EpcContractorDashboard = React.lazy(() => import("@/pages/epc-contractor/Dashboard"));
const InstallerDashboard = React.lazy(() => import("@/pages/installer/Dashboard"));
const MonitoringAnalystDashboard = React.lazy(() => import("@/pages/monitoring-analyst/Dashboard"));
const LiaisoningDashboard = React.lazy(() => import("@/pages/liaisoning/Dashboard"));
const LiaisoningCustomerApplications = React.lazy(() => import("@/pages/liaisoning/CustomerApplications"));
const LiaisoningProcess = React.lazy(() => import("@/pages/liaisoning/LiaisoningProcess"));
const LiaisoningDocumentManagement = React.lazy(() => import("@/pages/liaisoning/DocumentManagement"));
const LiaisoningDiscomManagement = React.lazy(() => import("@/pages/liaisoning/DiscomManagement"));
const LiaisoningNetMetering = React.lazy(() => import("@/pages/liaisoning/NetMetering"));
const LiaisoningInspectionApproval = React.lazy(() => import("@/pages/liaisoning/InspectionApproval"));
const LiaisoningCommissioning = React.lazy(() => import("@/pages/liaisoning/Commissioning"));
const LiaisoningSubsidyTracking = React.lazy(() => import("@/pages/liaisoning/SubsidyTracking"));
const LiaisoningFollowupsReminders = React.lazy(() => import("@/pages/liaisoning/FollowupsReminders"));
const LiaisoningReportsAnalytics = React.lazy(() => import("@/pages/liaisoning/ReportsAnalytics"));
const LiaisoningActivityLogs = React.lazy(() => import("@/pages/liaisoning/ActivityLogs"));

const CustomerDashboard = React.lazy(() => import("@/pages/customer/Dashboard"));
const CustomerInstallation = React.lazy(() => import("@/pages/customer/Installation"));
const CustomerService = React.lazy(() => import("@/pages/customer/Service"));
const CustomerPayments = React.lazy(() => import("@/pages/customer/Payments"));
const CustomerSettings = React.lazy(() => import("@/pages/customer/Settings"));

const SubAdminDashboard = React.lazy(() => import("@/pages/employee/SubAdminDashboard"));
const SubAdminComplaints = React.lazy(() => import("@/pages/employee/SubAdminComplaints"));
const SubAdminEmployees = React.lazy(() => import("@/pages/employee/SubAdminEmployees"));
const AmcManagement = React.lazy(() => import("@/pages/employee/AmcManagement"));
const SubAdminCalendar = React.lazy(() => import("@/pages/employee/SubAdminCalendar"));
const SubAdminFinancials = React.lazy(() => import("@/pages/employee/SubAdminFinancials"));
const WaareeSolarDashboard = React.lazy(() => import("@/pages/employee/WaareeSolarDashboard"));
const SubAdminCustomers = React.lazy(() => import("@/pages/employee/SubAdminCustomers"));
const SubAdminAttendance = React.lazy(() => import("@/pages/employee/SubAdminAttendance"));
const SubAdminDailyCommit = React.lazy(() => import("@/pages/employee/SubAdminDailyCommit"));
const SubAdminPartnerLeads = React.lazy(() => import("@/pages/employee/SubAdminPartnerLeads"));
const SubAdminSettings = React.lazy(() => import("@/pages/employee/SubAdminSettings"));

const ServiceExecutiveDashboard = React.lazy(() => import("@/pages/service-executive/Dashboard"));
const ProjectCoordinatorDashboard = React.lazy(() => import("@/pages/project-coordinator/Dashboard"));

const InventoryExecutiveDashboard = React.lazy(() => import("@/pages/inventory/Dashboard"));
const InventoryManagementPage = React.lazy(() => import("@/pages/inventory/Inventory"));
const InventoryCustomers = React.lazy(() => import("@/pages/inventory/InventoryCustomers"));
const InventorySettingsPage = React.lazy(() => import("@/pages/inventory/Settings"));

const MarketingDashboard = React.lazy(() => import("@/pages/marketing/Dashboard"));
const FinanceDashboard = React.lazy(() => import("@/pages/finance/Dashboard"));

const MockAdminPartnerDetail = () => <div>Partner Detail</div>;
const MockAdminComplaintDetail = () => <div>Complaint Detail</div>;
const MockEmployeeTaskDetail = () => <div>Task Detail</div>;

function PageLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <p className="text-xs font-medium text-slate-400">Loading module...</p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, allowedRoles, path }: { component: any, allowedRoles: string[], path: string }) {
  const { user, token } = useAuth();
  
  return (
    <Route path={path}>
      {(params) => {
        if (!token || !user) {
          return <Redirect to="/login" />;
        }
        
        const isPartnerRouteAccess = path.startsWith("/partner/") && (user.role === "partner" && !isEpcPartnerJobRole(user.jobRole) && !isInstallationTeamJobRole(user.jobRole));
        const isEpcRouteAccess = path.startsWith("/epc-contractor/") && (isEpcPartnerJobRole(user.jobRole) || (user.role as string) === "epc_contractor");
        const isInstallerRouteAccess = path.startsWith("/installer/") && (isInstallationTeamJobRole(user.jobRole) || (user.role as string) === "installer");
        const isServiceExecutiveRouteAccess = path.startsWith("/service-executive") && (isServiceExecutiveHeadJobRole(user.jobRole) || user.role === "admin" || user.role === "super_admin");
        const isMarketingRouteAccess = path.startsWith("/marketing/") && (user.role === "admin" || user.role === "super_admin" || (user.role === "employee" && isMarketingExecutiveJobRole(user.jobRole)));
        const isMonitoringAnalystRouteAccess = path.startsWith("/monitoring-analyst/") && (user.role === "admin" || user.role === "super_admin" || (user.role === "employee" && isMonitoringAnalystJobRole(user.jobRole)));
        const isLiaisoningRouteAccess = path.startsWith("/liaisoning/") && (user.role === "admin" || user.role === "super_admin" || (user.role === "employee" && (isLiaisoningEmployeeJobRole(user.jobRole) || isMonitoringAnalystJobRole(user.jobRole))));
        const isProjectCoordinatorRoute = path.startsWith("/project-coordinator/");
        const isProjectCoordinatorAccess =
          isProjectCoordinatorRoute &&
          (user.role === "admin" ||
            user.role === "super_admin" ||
            (["employee", "sub_admin", "team_lead", "department_head"].includes(user.role) &&
              isProjectCoordinatorJobRole(user.jobRole)));
        const isFinanceRoute = path.startsWith("/finance/");
        const isFinanceAccess = isFinanceRoute && getFinanceLevel(user) !== null;
        const isAllowed = isProjectCoordinatorRoute
          ? isProjectCoordinatorAccess
          : isFinanceRoute
          ? isFinanceAccess
          : allowedRoles.includes(user.role) || isPartnerRouteAccess || isEpcRouteAccess || isInstallerRouteAccess || isServiceExecutiveRouteAccess || isMarketingRouteAccess || isMonitoringAnalystRouteAccess || isLiaisoningRouteAccess;
        
        if (!isAllowed) {
          return <Redirect to={getRoleDashboardPath(user.role, user.jobRole)} />;
        }
        
        return (
          <ErrorBoundary key={path}>
            <Suspense fallback={<PageLoadingFallback />}>
              <Component params={params} />
            </Suspense>
          </ErrorBoundary>
        );
      }}
    </Route>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Home} />
        <Route path="/about" component={() => <div className="p-8 text-center mt-20 text-2xl font-bold">About Page (Coming Soon)</div>} />
        <Route path="/services" component={() => <div className="p-8 text-center mt-20 text-2xl font-bold">Services Page (Coming Soon)</div>} />
        <Route path="/contact" component={() => <div className="p-8 text-center mt-20 text-2xl font-bold">Contact Page (Coming Soon)</div>} />
        <Route path="/login" component={Login} />

        {/* Super Admin Routes */}
        <ProtectedRoute path="/super-admin/dashboard" component={SuperAdminDashboard} allowedRoles={['super_admin']} />
        <ProtectedRoute path="/super-admin/attendance" component={AdminAttendance} allowedRoles={['super_admin']} />

        {/* Admin Routes */}
        <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/customers" component={AdminCustomers} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/customer-onboarding" component={AdminCustomerOnboarding} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/customers/:id" component={AdminCustomerDetail} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/onboarding" component={OnboardingOverview} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/onboarding/requests" component={OnboardingRequests} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/onboarding/requests/new" component={NewOnboardingRequest} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/onboarding/requests/:id" component={OnboardingRequestDetail} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/employees" component={AdminEmployees} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/employees/:id" component={AdminEmployeeDetail} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/partners" component={AdminPartners} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/partners/:id" component={MockAdminPartnerDetail} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/complaints" component={AdminComplaints} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/complaints/:id" component={MockAdminComplaintDetail} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/inventory" component={AdminInventory} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/isphere-green" component={IsphereGreenPage} allowedRoles={['admin']} />
        <ProtectedRoute path="/admin/financials" component={AdminFinancials} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/settings" component={AdminSettings} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/admin/attendance" component={AdminAttendance} allowedRoles={['admin', 'super_admin']} />
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

        {/* EPC Contractor Routes */}
        <ProtectedRoute path="/epc-contractor/dashboard" component={EpcContractorDashboard} allowedRoles={['admin', 'super_admin', 'epc_contractor', 'partner']} />
        
        {/* Installation Team Routes */}
        <ProtectedRoute path="/installer/dashboard" component={InstallerDashboard} allowedRoles={['admin', 'super_admin', 'partner', 'employee', 'installer']} />
        
        {/* Monitoring Analyst Routes */}
        <ProtectedRoute path="/monitoring-analyst/dashboard" component={MonitoringAnalystDashboard} allowedRoles={['admin', 'super_admin', 'employee']} />
        
        {/* Liaisoning Employee Routes */}
        <ProtectedRoute path="/liaisoning/dashboard" component={LiaisoningDashboard} allowedRoles={['admin', 'super_admin', 'employee']} />
        <ProtectedRoute path="/liaisoning/applications" component={LiaisoningCustomerApplications} allowedRoles={['admin', 'super_admin', 'employee']} />
        <ProtectedRoute path="/liaisoning/process" component={LiaisoningProcess} allowedRoles={['admin', 'super_admin', 'employee']} />
        <ProtectedRoute path="/liaisoning/documents" component={LiaisoningDocumentManagement} allowedRoles={['admin', 'super_admin', 'employee']} />
        <ProtectedRoute path="/liaisoning/discom" component={LiaisoningDiscomManagement} allowedRoles={['admin', 'super_admin', 'employee']} />
        <ProtectedRoute path="/liaisoning/net-metering" component={LiaisoningNetMetering} allowedRoles={['admin', 'super_admin', 'employee']} />
        <ProtectedRoute path="/liaisoning/inspection" component={LiaisoningInspectionApproval} allowedRoles={['admin', 'super_admin', 'employee']} />
        <ProtectedRoute path="/liaisoning/commissioning" component={LiaisoningCommissioning} allowedRoles={['admin', 'super_admin', 'employee']} />
        <ProtectedRoute path="/liaisoning/subsidy" component={LiaisoningSubsidyTracking} allowedRoles={['admin', 'super_admin', 'employee']} />
        <ProtectedRoute path="/liaisoning/followups" component={LiaisoningFollowupsReminders} allowedRoles={['admin', 'super_admin', 'employee']} />
        <ProtectedRoute path="/liaisoning/reports" component={LiaisoningReportsAnalytics} allowedRoles={['admin', 'super_admin', 'employee']} />
        <ProtectedRoute path="/liaisoning/activities" component={LiaisoningActivityLogs} allowedRoles={['admin', 'super_admin', 'employee']} />
        
        {/* Customer Routes */}
        <ProtectedRoute path="/customer/dashboard" component={CustomerDashboard} allowedRoles={['admin', 'super_admin', 'customer']} />
        <ProtectedRoute path="/customer/installation" component={CustomerInstallation} allowedRoles={['admin', 'super_admin', 'customer']} />
        <ProtectedRoute path="/customer/service" component={CustomerService} allowedRoles={['admin', 'super_admin', 'customer']} />
        <ProtectedRoute path="/customer/payments" component={CustomerPayments} allowedRoles={['admin', 'super_admin', 'customer']} />
        <ProtectedRoute path="/customer/settings" component={CustomerSettings} allowedRoles={['admin', 'super_admin', 'customer']} />
        
        {/* Sub Admin Routes */}
        <ProtectedRoute path="/subadmin/dashboard" component={SubAdminDashboard} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
        <ProtectedRoute path="/subadmin/partner-leads" component={SubAdminPartnerLeads} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
        <ProtectedRoute path="/subadmin/partners-lead" component={SubAdminPartnerLeads} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
        <ProtectedRoute path="/subadmin/customers" component={SubAdminCustomers} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
        <ProtectedRoute path="/subadmin/customers/:id" component={AdminCustomerDetail} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
        <ProtectedRoute path="/subadmin/complaints" component={SubAdminComplaints} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
        <ProtectedRoute path="/subadmin/employees" component={SubAdminEmployees} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
        <ProtectedRoute path="/subadmin/amc-management" component={AmcManagement} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
        <ProtectedRoute path="/subadmin/calendar" component={SubAdminCalendar} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
        <ProtectedRoute path="/subadmin/financials" component={SubAdminFinancials} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
        <ProtectedRoute path="/subadmin/waaree-solar" component={WaareeSolarDashboard} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
        <ProtectedRoute path="/subadmin/attendance" component={SubAdminAttendance} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
        <ProtectedRoute path="/subadmin/daily-commit" component={SubAdminDailyCommit} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />
        <ProtectedRoute path="/subadmin/settings" component={SubAdminSettings} allowedRoles={['admin', 'super_admin', 'sub_admin', 'employee']} />

        {/* Legacy compatibility redirect */}
        <Route path="/subadmin/service-requests">
          <Redirect to="/subadmin/complaints" />
        </Route>

        {/* Service & Executive Head Routes */}
        <ProtectedRoute path="/service-executive/dashboard" component={ServiceExecutiveDashboard} allowedRoles={['admin', 'super_admin', 'employee', 'team_lead', 'department_head']} />
        <ProtectedRoute path="/project-coordinator/dashboard" component={ProjectCoordinatorDashboard} allowedRoles={['admin', 'super_admin', 'employee', 'sub_admin', 'team_lead', 'department_head']} />

        {/* Inventory Executive Routes */}
        <ProtectedRoute path="/inventory/dashboard" component={InventoryExecutiveDashboard} allowedRoles={['admin', 'super_admin', 'employee']} />
        <ProtectedRoute path="/inventory/inventory" component={InventoryManagementPage} allowedRoles={['admin', 'super_admin', 'employee']} />
        <ProtectedRoute path="/inventory/customers" component={InventoryCustomers} allowedRoles={['admin', 'super_admin', 'employee']} />
        <ProtectedRoute path="/inventory/settings" component={InventorySettingsPage} allowedRoles={['admin', 'super_admin', 'employee']} />

        {/* Marketing Executive Dashboard */}
        <ProtectedRoute path="/marketing/dashboard" component={MarketingDashboard} allowedRoles={['admin', 'super_admin', 'employee']} />
        <ProtectedRoute path="/marketing/onboarding" component={OnboardingOverview} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/marketing/onboarding/requests" component={OnboardingRequests} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/marketing/onboarding/requests/new" component={NewOnboardingRequest} allowedRoles={['admin', 'super_admin']} />
        <ProtectedRoute path="/marketing/onboarding/requests/:id" component={OnboardingRequestDetail} allowedRoles={['admin', 'super_admin']} />

        {/* Finance Department Workspace */}
        <ProtectedRoute path="/finance/dashboard" component={FinanceDashboard} allowedRoles={['admin', 'super_admin', 'employee', 'department_head', 'team_lead']} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useAuthProfileSync();

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
