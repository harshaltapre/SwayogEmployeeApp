import { useState, useEffect } from 'react';
import { SubAdminLayout } from '@/components/subadmin/SubAdminLayout';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import {
  Settings as SettingsIcon,
  Shield,
  Palette,
  Info,
  Sun,
  Moon,
  Monitor,
  Upload,
  ArrowLeft,
  User,
  Save,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

type SettingsSection = 'profile' | 'general' | 'appearance' | 'privacy' | 'about';
type ThemeMode = 'light' | 'dark' | 'system';

export default function SubAdminSettings() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState('');

  // Editable fields in state
  const [fullName, setFullName] = useState(user?.name || '');
  const [designation, setDesignation] = useState(user?.designation || 'Service Coordinator');
  const [department, setDepartment] = useState(user?.department || 'Operations');
  const [phone, setPhone] = useState('');

  // Initialize theme and photo from localStorage
  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as ThemeMode) || 'system';
    setTheme(savedTheme);
    applyTheme(savedTheme);
    
    const savedProfilePhoto = localStorage.getItem(`profilePhoto_${user?.id}`);
    if (savedProfilePhoto) {
      setProfilePhotoPreview(savedProfilePhoto);
    }
  }, [user?.id]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches);
        applyTheme('system');
      };
      mediaQuery.addEventListener('change', handleChange);
      setIsDarkMode(mediaQuery.matches);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const applyTheme = (mode: ThemeMode) => {
    const html = document.documentElement;
    let shouldBeDark = false;

    if (mode === 'dark') {
      shouldBeDark = true;
    } else if (mode === 'light') {
      shouldBeDark = false;
    } else {
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (shouldBeDark) {
      html.classList.add('dark');
      setIsDarkMode(true);
    } else {
      html.classList.remove('dark');
      setIsDarkMode(false);
    }
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBackClick = () => {
    navigate('/subadmin/dashboard');
  };

  const normalizeProfilePhoto = async (file: File): Promise<string> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read image file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });

    const image = new Image();
    image.src = dataUrl;
    await image.decode();

    const cropSize = Math.min(image.width, image.height);
    const sourceX = Math.floor((image.width - cropSize) / 2);
    const sourceY = Math.floor((image.height - cropSize) / 2);

    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to process the uploaded image');
    }

    ctx.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, 240, 240);
    return canvas.toDataURL('image/png');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size exceeds 2MB limit",
          variant: "destructive",
        });
        return;
      }
      
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        toast({
          title: "Invalid Format",
          description: "Only JPG, PNG, and GIF formats are supported",
          variant: "destructive",
        });
        return;
      }

      try {
        const photoData = await normalizeProfilePhoto(file);
        setProfilePhotoPreview(photoData);
        localStorage.setItem(`profilePhoto_${user?.id}`, photoData);
        toast({
          title: "Photo Uploaded",
          description: "✓ Profile photo uploaded successfully!",
        });
      } catch {
        toast({
          title: "Upload Failed",
          description: "Unable to process the uploaded image. Please try another file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveChanges = () => {
    if (!profilePhotoPreview) {
      toast({
        title: "Profile Photo Required",
        description: "Profile photo is compulsory! Please upload a front-facing selfie image.",
        variant: "destructive",
      });
      return;
    }

    setSaveMessage('Settings saved successfully!');
    toast({
      title: "Settings Saved",
      description: "Your profile preferences have been successfully updated.",
    });
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const sections = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'general' as const, label: 'General', icon: SettingsIcon },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
    { id: 'about' as const, label: 'About', icon: Info },
  ];

  const inputClassName =
    'w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  const sectionCardClassName = 'rounded-lg border border-border bg-card shadow-sm';

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1'
        )}
      />
    </button>
  );

  const SettingCard = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
    <div className={sectionCardClassName}>
      <div className="border-b border-border px-4 py-3 sm:px-6 sm:py-4 bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{description}</p>}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );

  const SettingRow = ({ label, hint, control }: { label: string; hint?: string; control: React.ReactNode }) => (
    <div className="flex flex-col gap-3 border-b border-border/60 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0 sm:ml-4">{control}</div>
    </div>
  );

  const themeOptionClass = (selected: boolean) =>
    cn(
      'flex w-full cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors',
      selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40',
    );

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className={sectionCardClassName}>
              <div className="border-b border-border px-6 py-4 bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Profile Details
                </h3>
              </div>
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="w-full lg:w-52 shrink-0">
                    <div className="relative w-36 h-36 mx-auto">
                      <img
                        src={profilePhotoPreview || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                        alt="Profile"
                        className="w-36 h-36 rounded-lg object-cover border-2 border-border"
                      />
                      <label className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary text-primary-foreground cursor-pointer flex items-center justify-center shadow">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-4">JPG, GIF or PNG. Max size 2MB (Compulsory)</p>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">Full Name</label>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClassName} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">Designation</label>
                      <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} className={inputClassName} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">Email Address</label>
                      <input type="email" value={user?.email || ''} className={inputClassName} disabled />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">Department</label>
                      <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClassName} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">Phone Number</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClassName} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="space-y-4">
            <SettingCard title="Work Preferences" description="Manage your work settings">
              <SettingRow
                label="Employee ID"
                control={<span className="text-slate-900 dark:text-white font-medium">{user?.employeeCode || '—'}</span>}
              />
              <SettingRow
                label="Status"
                control={<span className="text-green-600 dark:text-green-400 font-medium">Active</span>}
              />
              <SettingRow
                label="Email Notifications"
                hint="Receive email for important updates"
                control={<ToggleSwitch checked={true} onChange={() => {}} />}
              />
              <SettingRow
                label="Task Reminders"
                hint="Get reminded about upcoming tasks"
                control={<ToggleSwitch checked={true} onChange={() => {}} />}
              />
              <SettingRow
                label="Attendance Alerts"
                hint="Receive alerts for attendance-related events"
                control={<ToggleSwitch checked={true} onChange={() => {}} />}
              />
            </SettingCard>

            <SettingCard title="Language & Region">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Language</label>
                  <select className={inputClassName}>
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Marathi</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Time Zone</label>
                  <select className={inputClassName}>
                    <option>IST (UTC+5:30)</option>
                    <option>UTC</option>
                    <option>EST (UTC-5)</option>
                  </select>
                </div>
              </div>
            </SettingCard>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-4">
            <SettingCard title="Theme Mode" description="Choose how the app should appear">
              <div className="space-y-3">
                <label className={themeOptionClass(theme === 'light')}>
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={theme === 'light'}
                    onChange={(e) => handleThemeChange(e.target.value as ThemeMode)}
                    className="h-4 w-4 shrink-0 accent-primary"
                  />
                  <Sun className="h-5 w-5 shrink-0 text-amber-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Light Mode</p>
                    <p className="text-xs text-muted-foreground">Bright and easy to read</p>
                  </div>
                </label>

                <label className={themeOptionClass(theme === 'dark')}>
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={theme === 'dark'}
                    onChange={(e) => handleThemeChange(e.target.value as ThemeMode)}
                    className="h-4 w-4 shrink-0 accent-primary"
                  />
                  <Moon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Easy on the eyes at night</p>
                  </div>
                </label>

                <label className={themeOptionClass(theme === 'system')}>
                  <input
                    type="radio"
                    name="theme"
                    value="system"
                    checked={theme === 'system'}
                    onChange={(e) => handleThemeChange(e.target.value as ThemeMode)}
                    className="h-4 w-4 shrink-0 accent-primary"
                  />
                  <Monitor className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">System Mode</p>
                    <p className="text-xs text-muted-foreground">
                      Follow your device settings (Currently: {isDarkMode ? 'Dark' : 'Light'})
                    </p>
                  </div>
                </label>
              </div>
            </SettingCard>

            <SettingCard title="Display Options">
              <SettingRow
                label="Compact View"
                hint="Show more information on screen"
                control={<ToggleSwitch checked={false} onChange={() => {}} />}
              />
              <SettingRow
                label="Animations"
                hint="Enable smooth transitions"
                control={<ToggleSwitch checked={true} onChange={() => {}} />}
              />
            </SettingCard>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            <SettingCard title="Privacy Settings" description="Control who can see your information">
              <SettingRow
                label="Profile Visibility"
                hint="Allow other employees to view your profile"
                control={<ToggleSwitch checked={true} onChange={() => {}} />}
              />
              <SettingRow
                label="Show Status"
                hint="Display your online status to team"
                control={<ToggleSwitch checked={true} onChange={() => {}} />}
              />
              <SettingRow
                label="Activity Sharing"
                hint="Share your activity with managers"
                control={<ToggleSwitch checked={true} onChange={() => {}} />}
              />
            </SettingCard>

            <SettingCard title="Data & Security" description="Manage your data and account security">
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Download Your Data</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Get a copy of your personal data</p>
                  </div>
                  <span className="text-blue-600">→</span>
                </button>
                <button className="w-full flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Change Password</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Update your account password</p>
                  </div>
                  <span className="text-blue-600">→</span>
                </button>
                <button className="w-full flex items-center justify-between p-3 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left">
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Delete Account</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Permanently delete your account</p>
                  </div>
                  <span className="text-red-600">→</span>
                </button>
              </div>
            </SettingCard>

            <SettingCard title="Privacy Policy">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                We take your privacy seriously. Your data is encrypted and stored securely.
              </p>
              <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                Read Full Privacy Policy →
              </button>
            </SettingCard>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-4">
            <SettingCard title="About This Application">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">SWAYOG Energy Platform</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Version 2.1.0
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    A comprehensive energy management and employee workflow platform designed for modern enterprises.
                  </p>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-3">Features</h4>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-1">✓</span>
                      <span>Employee workflow management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-1">✓</span>
                      <span>Task tracking and delegation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-1">✓</span>
                      <span>Real-time collaboration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-1">✓</span>
                      <span>Advanced analytics and reporting</span>
                    </li>
                  </ul>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-3">Contact & Support</h4>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <p>Email: <span className="text-blue-600 dark:text-blue-400">support@swayog.com</span></p>
                    <p>Website: <span className="text-blue-600 dark:text-blue-400">www.swayog.com</span></p>
                    <p>Support Hours: Monday - Friday, 9AM - 6PM IST</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    © 2024 SWAYOG Energy Platform. All rights reserved.
                  </p>
                </div>
              </div>
            </SettingCard>

            <SettingCard title="Third-Party Licenses">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                This application uses the following open-source libraries:
              </p>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• React - MIT License</li>
                <li>• Tailwind CSS - MIT License</li>
                <li>• Lucide Icons - ISC License</li>
                <li>• TypeScript - Apache 2.0 License</li>
              </ul>
            </SettingCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SubAdminLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900/40 p-3 sm:p-4 md:p-6 lg:p-8 text-foreground">
        <div className="mx-auto max-w-5xl space-y-4 md:space-y-6">
          <div className="rounded-2xl border border-border bg-card p-4 md:p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight md:text-2xl">Account Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your profile, preferences, and how the app looks on your device.
                </p>
              </div>
              <button
                onClick={handleSaveChanges}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const selected = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-md border px-3 py-2 text-xs font-medium transition-colors',
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {section.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-border px-3 py-2">Signed in as {user?.name || 'Service Coordinator'}</div>
              <div className="rounded-lg border border-border px-3 py-2 capitalize">Current section: {activeSection}</div>
              <button
                onClick={handleLogout}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>

            {saveMessage && (
              <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
                ✓ {saveMessage}
              </div>
            )}
          </div>

          {renderSection()}
        </div>
      </div>
    </SubAdminLayout>
  );
}
