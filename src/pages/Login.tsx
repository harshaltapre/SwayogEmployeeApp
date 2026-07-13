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
  UserCog,
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
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Sub Admin login is not supported in this phase
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

type CredentialMode = "email" | "id";

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
    key: "super_admin",
    label: "Super Admin",
    icon: Crown,
    description: "Platform owner and global access",
    emailPlaceholder: "superadmin@company.com",
    loginIdPlaceholder: "SADM-XXXXXX",
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
    key: "employee",
    label: "Employee",
    icon: HardHat,
    description: "Tasks, field work & attendance",
    emailPlaceholder: "employee@company.com",
    loginIdPlaceholder: "EMP-XXXXXX",
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
  const [credentialMode, setCredentialMode] = useState<CredentialMode>("email");
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const effectiveApiBaseUrl = getEffectiveApiBaseUrl();
  const backendAuthConfigured = Boolean(effectiveApiBaseUrl);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      role: "super_admin",
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
        login(data.token, data.user, data.refreshToken);
        toast({ title: "Welcome back!", description: `Logged in as ${data.user.name}` });
        setLocation(getRoleDashboardPath(data.user.role, data.user.jobRole));
      },
      onError: (error) => {
        toast({ title: "Login Failed", description: getLoginErrorMessage(error), variant: "destructive" });
      },
    },
  });

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
    loginMutation.mutate({
      data: {
        identifier: data.identifier ?? "",
        password: data.password ?? "",
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
  const ActiveRoleIcon = activeRole.icon;

  const handleForgotPassword = () => {
    toast({
      title: "Password reset",
      description: "Password reset flow will be connected in the next auth phase.",
    });
  };

  return (
    <div className="min-h-screen bg-surface-bright flex flex-col">
      <main className="flex-1 flex flex-col lg:flex-row min-h-screen">
        <section className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-primary">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(72,187,120,0.28),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.16),transparent_50%)]" />
          <div className="absolute inset-0 opacity-25 bg-[linear-gradient(120deg,transparent_10%,rgba(255,255,255,0.22)_45%,transparent_80%)]" />

          <div className="relative z-10 p-10 xl:p-14 flex flex-col justify-between w-full text-on-primary">
            <div>
              <Link href="/">
                <div className="inline-flex items-center gap-2 text-on-primary/80 hover:text-on-primary transition-colors cursor-pointer">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back to Home</span>
                </div>
              </Link>

              <img src="/logo.png" alt="SWAYOG" style={{ height: "60px", width: "auto", objectFit: "contain" }} className="mt-6" />
            </div>

            <div className="max-w-xl">
              <h1 className="text-4xl xl:text-6xl font-extrabold tracking-tight leading-tight">
                The Digital Architect
                <br />
                <span className="text-secondary">of Sustainable Energy</span>
              </h1>
              <p className="mt-5 text-base xl:text-lg leading-relaxed text-on-primary/85">
                Managing clean-energy operations with precision software built for enterprise reliability,
                governance, and speed.
              </p>
            </div>

            <div className="flex flex-wrap gap-5 text-sm text-on-primary/75">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-secondary" />
                Enterprise Grade Security
              </div>
              <div className="flex items-center gap-2">
                <HardHat className="h-4 w-4 text-secondary" />
                99.9% Uptime SLA
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1 flex items-center justify-center p-5 sm:p-8 bg-surface-container-lowest">
          <div className="w-full max-w-xl">
            <div className="lg:hidden mb-6">
              <Link href="/">
                <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back to Home</span>
                </div>
              </Link>
            </div>

            <div className="mb-6 sm:mb-8">
              <img src="/logo.png" alt="SWAYOG" style={{ height: "48px", width: "auto", objectFit: "contain" }} className="lg:hidden mb-4" />
              <h2 className="text-3xl font-bold text-foreground mb-1">Welcome Back</h2>
              <p className="text-muted-foreground">Access your Swayog Energy portal.</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ActiveRoleIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Signing in as</p>
                  <p className="font-semibold text-foreground">{activeRole.label}</p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between gap-3">
                          <FormLabel className="text-sm text-muted-foreground">Email or Login ID</FormLabel>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setCredentialMode("email")}
                              className={`text-[11px] rounded-md px-2.5 py-1 border transition-colors ${credentialMode === "email"
                                ? "border-primary/35 text-primary bg-primary/8"
                                : "border-border text-muted-foreground hover:text-foreground"
                                }`}
                            >
                              Use Email
                            </button>
                            <button
                              type="button"
                              onClick={() => setCredentialMode("id")}
                              className={`text-[11px] rounded-md px-2.5 py-1 border transition-colors ${credentialMode === "id"
                                ? "border-primary/35 text-primary bg-primary/8"
                                : "border-border text-muted-foreground hover:text-foreground"
                                }`}
                            >
                              Use Login ID
                            </button>
                          </div>
                        </div>
                        <FormControl>
                          <Input
                            placeholder={
                              credentialMode === "email"
                                ? activeRole.emailPlaceholder
                                : activeRole.loginIdPlaceholder
                            }
                            autoComplete="username"
                            {...field}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel className="text-sm text-muted-foreground">Security Password</FormLabel>
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-xs text-primary hover:text-primary/80 font-medium"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              autoComplete="current-password"
                              {...field}
                              className="h-11 pr-11"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                    />
                    Keep me logged in for 30 days
                  </label>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      `Sign in as ${activeRole.label}`
                    )}
                  </Button>

                  {selectedRole === "customer" && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11"
                      onClick={() => setIsRegisterDialogOpen(true)}
                    >
                      Create Customer Account
                    </Button>
                  )}
                </form>
              </Form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-card text-muted-foreground">Select Portal Role</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {roles.map((role) => {
                    const isSelected = selectedRole === role.key;
                    const Icon = role.icon;

                    return (
                      <button
                        key={role.key}
                        type="button"
                        onClick={() => handleRoleSelect(role.key)}
                        className={`flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] border rounded-md transition-colors ${isSelected
                          ? "border-primary text-primary bg-primary/8"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                          }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {role.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <footer className="w-full px-5 sm:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 bg-background border-t border-border">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">SWAYOG</span>
          <span className="text-xs sm:text-sm text-muted-foreground">© 2026 Swayog Energy. All rights reserved.</span>
        </div>
        <div className="flex gap-5">
          <a className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Terms of Service</a>
          <a className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Security</a>
        </div>
      </footer>

      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create Customer Account</DialogTitle>
            <DialogDescription className="text-muted-foreground">
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
                    <FormLabel className="text-muted-foreground">Full Name</FormLabel>
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
                    <FormLabel className="text-muted-foreground">Email</FormLabel>
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
                    <FormLabel className="text-muted-foreground">Phone Number (Optional)</FormLabel>
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
                    <FormLabel className="text-muted-foreground">Password</FormLabel>
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
                    <FormLabel className="text-muted-foreground">Confirm Password</FormLabel>
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
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={registerCustomerMutation.isPending}>
                  {registerCustomerMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
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
