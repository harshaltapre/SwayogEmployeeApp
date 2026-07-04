import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, HardHat, CheckCircle } from "lucide-react";

const registrationSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
    employeeId: z.string().min(4, "Employee ID must be at least 4 characters"),
    department: z.string().min(2, "Department is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface RegisteredEmployee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  employeeId: string;
  department: string;
  joinDate: string;
  status: "pending" | "approved" | "rejected";
}

const EMPLOYEES_STORAGE_KEY = "registered_employees";

function getRegisteredEmployees(): RegisteredEmployee[] {
  try {
    const stored = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveEmployeeRegistration(employee: RegisteredEmployee) {
  const employees = getRegisteredEmployees();
  employees.push(employee);
  localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
}

export default function EmployeeRegistration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      employeeId: "",
      department: "",
    },
  });

  const onSubmit = async (data: RegistrationFormValues) => {
    setIsSubmitting(true);
    try {
      // Check if email already exists
      const employees = getRegisteredEmployees();
      if (employees.some((emp) => emp.email === data.email)) {
        toast({
          title: "Registration Failed",
          description: "Email is already registered. Please use a different email.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check if employee ID already exists
      if (employees.some((emp) => emp.employeeId === data.employeeId)) {
        toast({
          title: "Registration Failed",
          description: "Employee ID is already registered.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newEmployee: RegisteredEmployee = {
        id: Math.max(0, ...employees.map((e) => e.id), 0) + 1,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password, // In production, this should be hashed
        employeeId: data.employeeId,
        department: data.department,
        joinDate: new Date().toISOString().split("T")[0],
        status: "pending",
      };

      saveEmployeeRegistration(newEmployee);
      setRegistrationSuccess(true);

      toast({
        title: "Registration Successful!",
        description: "Your account has been created. You can now login.",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "An error occurred during registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Registration Successful!</h1>
          <p className="text-slate-400 mb-8">
            Your employee account has been created successfully. Redirecting to login...
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/login")}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-6">
        <Link href="/">
          <div className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </div>
        </Link>
        <div className="flex items-center gap-2 text-white font-bold text-xl bg-white/10 px-3 py-1.5 rounded-lg">
          <img src="/logo.png" alt="SWAYOG" className="h-6 w-auto" />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center">
                <HardHat className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Employee Registration</h1>
            </div>
            <p className="text-slate-400 text-sm">Create your employee account with SWAYOG</p>
          </div>

          {/* Registration Form */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">First Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John"
                            {...field}
                            className="h-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-white/40 focus:bg-white/15"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Last Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Doe"
                            {...field}
                            className="h-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-white/40 focus:bg-white/15"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 text-sm">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          {...field}
                          className="h-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-white/40 focus:bg-white/15"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone & Employee ID */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="9876543210"
                            {...field}
                            className="h-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-white/40 focus:bg-white/15"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Employee ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="EMP-2024-001"
                            {...field}
                            className="h-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-white/40 focus:bg-white/15"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Department */}
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 text-sm">Department</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="h-10 w-full bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:border-white/40 focus:bg-white/15 rounded-md px-3 py-2"
                        >
                          <option value="">Select Department</option>
                          <option value="Installation">Installation</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Support">Support</option>
                          <option value="Technical">Technical</option>
                          <option value="Operations">Operations</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••"
                            {...field}
                            className="h-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-white/40 focus:bg-white/15"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm">Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••"
                            {...field}
                            className="h-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-white/40 focus:bg-white/15"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full h-11 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-semibold mt-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {/* Login Link */}
                <div className="text-center text-sm text-slate-400 mt-4">
                  Already have an account?{" "}
                  <Link href="/login" className="text-sky-400 hover:text-sky-300 font-medium">
                    Sign in here
                  </Link>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
