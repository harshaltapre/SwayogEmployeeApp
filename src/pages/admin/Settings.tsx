import { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import {
  Building2,
  Bell,
  ChevronRight,
  Globe,
  Info,
  Lock,
  LogOut,
  Moon,
  Save,
  Search,
  Settings as SettingsIcon,
  Shield,
  Sun,
  Upload,
  User,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsSection = 'profile' | 'security' | 'preferences' | 'system';

export default function AdminSettings() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [fullName, setFullName] = useState(user?.name || 'John Anderson');
  const [email, setEmail] = useState(user?.email || 'john@company.com');
  const [jobTitle, setJobTitle] = useState('Admin Manager');
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [location, setLocation] = useState('San Francisco, CA');
  const [bio, setBio] = useState('Passionate about building great products and leading teams.');
  const [profilePhoto, setProfilePhoto] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=admin');
  const [companyName, setCompanyName] = useState('Solar OS Inc');
  const [timezone, setTimezone] = useState('PST (UTC-8)');
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('USD');
  const [darkMode, setDarkMode] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState(true);
  const [systemAlertsEnabled, setSystemAlertsEnabled] = useState(true);
  const [financialReportsEnabled, setFinancialReportsEnabled] = useState(true);
  const [marketingUpdatesEnabled, setMarketingUpdatesEnabled] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const sections = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'preferences' as const, label: 'Preferences', icon: SettingsIcon },
    { id: 'system' as const, label: 'System', icon: Info },
  ];

  const handleSaveChanges = () => {
    setSaveMessage('Changes saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const inputClassName =
    'w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  const sectionCardClassName = 'rounded-lg border border-border bg-card shadow-sm';

  const renderToggle = (checked: boolean, onChange: (next: boolean) => void) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted'
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1'
        )}
      />
    </button>
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
                        src={profilePhoto}
                        alt="Profile"
                        className="w-36 h-36 rounded-lg object-cover border-2 border-border"
                      />
                      <label className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary text-primary-foreground cursor-pointer flex items-center justify-center shadow">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-4">JPG, GIF or PNG. Max size 2MB</p>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">Full Name</label>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClassName} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">Job Title</label>
                      <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClassName} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">Email Address</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClassName} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">Phone Number</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClassName} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">Location</label>
                      <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClassName} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className={cn(inputClassName, 'resize-none')}
                    placeholder="Tell your team about your responsibilities and background"
                  />
                  <p className="text-xs text-muted-foreground mt-2">{bio.length}/500 characters</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className={cn(sectionCardClassName, 'xl:col-span-8')}>
              <div className="border-b border-border px-6 py-4 bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Password & Access
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-2">Current Password</label>
                    <input type="password" placeholder="••••••••" className={inputClassName} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-2">New Password</label>
                    <input type="password" placeholder="••••••••" className={inputClassName} />
                  </div>
                </div>
                <button className="px-5 py-2 rounded-md border border-primary/20 text-primary hover:bg-primary/10 transition-colors text-sm font-medium">
                  Update Password
                </button>
              </div>
            </div>

            <div className={cn(sectionCardClassName, 'xl:col-span-4')}>
              <div className="border-b border-border px-6 py-4 bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Security Controls
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Protect sign-ins with an authenticator app.</p>
                  </div>
                  {renderToggle(twoFactorEnabled, setTwoFactorEnabled)}
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Session Timeout</p>
                    <p className="text-xs text-muted-foreground">Auto-logout after inactivity.</p>
                  </div>
                  {renderToggle(sessionTimeoutEnabled, setSessionTimeoutEnabled)}
                </div>

                <p className="text-xs text-muted-foreground">Last security review: April 20, 2026</p>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className={cn(sectionCardClassName, 'xl:col-span-7')}>
              <div className="border-b border-border px-6 py-4 bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Regional Preferences
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">Company Name</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClassName} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">Timezone</label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClassName}>
                    <option>PST (UTC-8)</option>
                    <option>EST (UTC-5)</option>
                    <option>GMT (UTC+0)</option>
                    <option>CET (UTC+1)</option>
                    <option>IST (UTC+5:30)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClassName}>
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Japanese</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">Default Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClassName}>
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                    <option>JPY</option>
                    <option>INR</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={cn(sectionCardClassName, 'xl:col-span-5')}>
              <div className="border-b border-border px-6 py-4 bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Notifications & Theme
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="rounded-md border border-border p-4 bg-muted/20">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-sm font-semibold text-foreground">Theme Mode</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      {darkMode ? 'Dark' : 'Light'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDarkMode(true)}
                      className={cn(
                        'text-xs rounded-md border px-3 py-2 transition-colors',
                        darkMode ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                      )}
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => setDarkMode(false)}
                      className={cn(
                        'text-xs rounded-md border px-3 py-2 transition-colors',
                        !darkMode ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                      )}
                    >
                      Light
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">System Alerts</p>
                      <p className="text-xs text-muted-foreground">Critical infrastructure updates.</p>
                    </div>
                    {renderToggle(systemAlertsEnabled, setSystemAlertsEnabled)}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Financial Reports</p>
                      <p className="text-xs text-muted-foreground">Weekly ROI and asset yields.</p>
                    </div>
                    {renderToggle(financialReportsEnabled, setFinancialReportsEnabled)}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Marketing Updates</p>
                      <p className="text-xs text-muted-foreground">Product updates and newsletters.</p>
                    </div>
                    {renderToggle(marketingUpdatesEnabled, setMarketingUpdatesEnabled)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            <div className={sectionCardClassName}>
              <div className="border-b border-border px-6 py-4 bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  System Information
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-md border border-border p-4 bg-muted/20">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">App Version</p>
                  <p className="text-lg font-semibold text-foreground mt-1">2.1.0</p>
                </div>
                <div className="rounded-md border border-border p-4 bg-muted/20">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Build Number</p>
                  <p className="text-lg font-semibold text-foreground mt-1">2026.04.20.003</p>
                </div>
                <div className="rounded-md border border-border p-4 bg-muted/20">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Company</p>
                  <p className="text-lg font-semibold text-foreground mt-1">Solar OS Inc</p>
                </div>
                <div className="rounded-md border border-border p-4 bg-muted/20">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Support</p>
                  <a href="#" className="text-lg font-semibold text-primary mt-1 inline-block">support.solaros.com</a>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-destructive/40 bg-destructive/5">
              <div className="border-b border-destructive/30 px-6 py-4">
                <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Danger Zone
                </h3>
              </div>
              <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Delete Account</p>
                  <p className="text-xs text-muted-foreground mt-1">Once deleted, this action cannot be undone.</p>
                </div>
                <button className="px-5 py-2.5 text-sm font-semibold border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors rounded-md">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8 text-foreground">
        <div className="mx-auto max-w-5xl space-y-4 md:space-y-6">
          <div className="rounded-2xl border border-border bg-white p-4 md:p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight md:text-2xl">Account Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your profile, security preferences, and system configuration.
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
              <div className="rounded-lg border border-border px-3 py-2">Signed in as {user?.name || 'Admin'}</div>
              <div className="rounded-lg border border-border px-3 py-2 capitalize">Current section: {activeSection.replace('-', ' ')}</div>
              <button
                onClick={handleLogout}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>

            {saveMessage && (
              <div className="mt-4 rounded-md border border-secondary/30 bg-secondary/10 px-3 py-2 text-sm text-secondary">
                ✓ {saveMessage}
              </div>
            )}
          </div>

          {renderSection()}
        </div>
      </div>
    </SidebarLayout>
  );
}
