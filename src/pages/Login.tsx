import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getEffectiveApiBaseUrl, useLogin, useRegisterCustomer } from "@/lib/api-client";
import { getRoleDashboardPath, useAuth, type UserRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  ShieldCheck,
  HardHat,
  Handshake,
  User,
  Eye,
  EyeOff,
  Crown,
  Smartphone,
  Mail,
  Fingerprint,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const loginSchema = z.object({
  identifier: z.string().min(3, "Enter your email or login ID"),
  password: z.string().optional(),
  otp: z.string().optional(),
  role: z.enum(["super_admin", "admin", "employee", "partner", "customer"] as const),
});

const customerRegisterSchema = z
  .object({
    fullName: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().email("Enter a valid email"),
    phoneNumber: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || value.length >= 8, "Phone must be at least 8 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type CustomerRegisterFormValues = z.infer<typeof customerRegisterSchema>;
type LoginRole = LoginFormValues["role"];

type CredentialMode = "email_passcode" | "mobile_otp";

type RoleOption = {
  key: LoginRole;
  label: string;
  icon: LucideIcon;
  description: string;
  emailPlaceholder: string;
  loginIdPlaceholder: string;
};

const roles: RoleOption[] = [
  {
    key: "employee",
    label: "Employee",
    icon: HardHat,
    description: "Tasks, field work & attendance",
    emailPlaceholder: "employee@company.com",
    loginIdPlaceholder: "EMP-XXXXXX",
  },
  {
    key: "admin",
    label: "Admin",
    icon: ShieldCheck,
    description: "Full platform access & management",
    emailPlaceholder: "admin@company.com",
    loginIdPlaceholder: "ADM-XXXXXX",
  },
  {
    key: "super_admin",
    label: "Super Admin",
    icon: Crown,
    description: "Platform owner and global access",
    emailPlaceholder: "superadmin@company.com",
    loginIdPlaceholder: "SADM-XXXXXX",
  },
  {
    key: "partner",
    label: "Partner",
    icon: Handshake,
    description: "Projects, commissions & payouts",
    emailPlaceholder: "partner@company.com",
    loginIdPlaceholder: "PRT-XXXXXX",
  },
  {
    key: "customer",
    label: "Customer",
    icon: User,
    description: "Installations, service & payments",
    emailPlaceholder: "customer@example.com",
    loginIdPlaceholder: "CUST-XXXXXX",
  },
];

function getLoginErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const maybeError = error as Record<string, unknown>;
    if (typeof maybeError.error === "string") {
      return maybeError.error;
    }
    if (typeof maybeError.message === "string") {
      return maybeError.message;
    }
  }
  return "Invalid credentials";
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [credentialMode, setCredentialMode] = useState<CredentialMode>("email_passcode");
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);

  const effectiveApiBaseUrl = getEffectiveApiBaseUrl();
  const backendAuthConfigured = Boolean(effectiveApiBaseUrl);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      otp: "",
      role: "employee",
    },
  });

  const registerForm = useForm<CustomerRegisterFormValues>({
    resolver: zodResolver(customerRegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const selectedRole = form.watch("role");

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        if (data.user.role === "employee" || data.user.role === "sub_admin") {
          setPendingLoginData(data);
          setShowBiometric(true);
        } else {
          completeLogin(data);
        }
      },
      onError: (error) => {
        toast({ title: "Login Failed", description: getLoginErrorMessage(error), variant: "destructive" });
      },
    },
  });

  const completeLogin = (data: any) => {
    login(data.token, data.user, data.refreshToken);
    toast({ title: "Welcome back!", description: `Logged in as ${data.user.name}` });
    setLocation(getRoleDashboardPath(data.user.role, data.user.jobRole));
  };

  const registerCustomerMutation = useRegisterCustomer({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.user, data.refreshToken);
        toast({
          title: "Account created",
          description: `Welcome ${data.user.name}. Your account is ready.`,
        });
        setIsRegisterDialogOpen(false);
        registerForm.reset();
        setLocation(getRoleDashboardPath(data.user.role, data.user.jobRole));
      },
      onError: (error) => {
        toast({
          title: "Registration failed",
          description: getLoginErrorMessage(error),
          variant: "destructive",
        });
      },
    },
  });

  const handleRoleSelect = (roleKey: LoginRole) => {
    form.setValue("role", roleKey, { shouldValidate: true });
  };

  const onSubmit = (data: LoginFormValues) => {
    if (credentialMode === "email_passcode" && !data.password) {
      form.setError("password", { message: "Password is required" });
      return;
    }
    
    loginMutation.mutate({
      data: {
        identifier: data.identifier ?? "",
        password: credentialMode === "email_passcode" ? data.password ?? "" : "OTP_MOCK",
        role: (data.role ?? "customer") as LoginRole,
      },
    });
  };

  const onRegisterCustomer = (values: CustomerRegisterFormValues) => {
    if (!backendAuthConfigured) {
      toast({
        title: "Backend not configured",
        description: "Set VITE_AUTH_API_BASE_URL or VITE_API_BASE_URL before registering.",
        variant: "destructive",
      });
      return;
    }

    registerCustomerMutation.mutate({
      data: {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber?.trim() ? values.phoneNumber.trim() : undefined,
        password: values.password,
      },
    });
  };

  const activeRole = roles.find(r => r.key === selectedRole)!;

  if (showBiometric && pendingLoginData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(245,158,11,0.3)] animate-pulse">
          <Fingerprint className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Enable Biometrics</h2>
        <p className="text-slate-400 text-center mb-10 max-w-sm">
          Enable one-touch biometric verification to securely access your field workspace without typing your password.
        </p>
        
        <div className="space-y-4 w-full max-w-sm">
          <Button 
            className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-lg rounded-xl shadow-lg shadow-amber-500/20"
            onClick={() => {
              toast({ title: "Biometrics Enabled", description: "Your device is now securely linked." });
              completeLogin(pendingLoginData);
            }}
          >
            Enable Biometrics
          </Button>
          <Button 
            variant="ghost" 
            className="w-full h-14 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
            onClick={() => completeLogin(pendingLoginData)}
          >
            Skip for Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <div className="hidden md:flex md:w-1/2 bg-slate-900 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.15),transparent_50%)]" />
        <img src="/logo.png" alt="SWAYOG" className="h-20 w-auto mb-8 z-10 brightness-0 invert" />
        <h1 className="text-4xl font-bold mb-4 z-10 text-center">Swayog Energy Portal</h1>
        <p className="text-slate-400 text-center max-w-md z-10">
          The unified platform for our workforce, field engineers, and partners to build a sustainable future.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 bg-white md:rounded-l-3xl shadow-2xl z-20">
        <div className="w-full max-w-sm mx-auto">
          
          <div className="md:hidden flex flex-col items-center mb-10">
            <img src="/logo.png" alt="SWAYOG" className="h-12 w-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-sm text-slate-500">Enter credentials to access your workspace</p>
          </div>

          <div className="hidden md:block mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Sign In</h2>
            <p className="text-slate-500 mt-2">Enter credentials to access your workspace</p>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
            <button
              type="button"
              onClick={() => setCredentialMode("email_passcode")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                credentialMode === "email_passcode"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Mail className="w-4 h-4" />
              Email & Passcode
            </button>
            <button
              type="button"
              onClick={() => setCredentialMode("mobile_otp")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                credentialMode === "mobile_otp"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile OTP
            </button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">
                      {credentialMode === "email_passcode" ? "Login ID / Email" : "Phone Number"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          credentialMode === "email_passcode"
                            ? activeRole.loginIdPlaceholder
                            : "+91 98XXXXXXXX"
                        }
                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white rounded-xl text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {credentialMode === "email_passcode" ? (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-slate-700 font-semibold">Security Password</FormLabel>
                        <button type="button" className="text-xs text-amber-600 font-semibold hover:underline">
                          Forgot?
                        </button>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-12 bg-slate-50 border-slate-200 focus:bg-white rounded-xl text-base pr-12"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 px-4 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="space-y-4">
                  <Button type="button" variant="outline" className="w-full h-12 rounded-xl border-amber-500 text-amber-600 hover:bg-amber-50">
                    Send OTP
                  </Button>
                  <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold">6-Digit Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000000"
                            className="h-12 bg-slate-50 border-slate-200 focus:bg-white rounded-xl text-center tracking-widest text-lg font-bold"
                            maxLength={6}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl mt-2 shadow-lg shadow-slate-900/20"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-xs text-center text-slate-500 mb-4 uppercase tracking-wider font-semibold">
              Select Portal Role
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {roles.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => handleRoleSelect(role.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                    selectedRole === role.key
                      ? "bg-amber-100 border-amber-300 text-amber-800"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
          
          {selectedRole === "customer" && (
            <div className="mt-6 text-center">
              <button onClick={() => setIsRegisterDialogOpen(true)} className="text-sm font-semibold text-amber-600 hover:underline">
                Create Customer Account
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Customer Account</DialogTitle>
            <DialogDescription>
              Register with your email and password to use genuine customer login.
            </DialogDescription>
          </DialogHeader>

          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegisterCustomer)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 98XXXXXXXX" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Minimum 8 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Re-enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRegisterDialogOpen(false)}
                  disabled={registerCustomerMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={registerCustomerMutation.isPending}>
                  {registerCustomerMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
