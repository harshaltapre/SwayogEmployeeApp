import { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import {
  Settings as SettingsIcon,
  Lock,
  Users,
  Bell,
  Palette,
  Zap,
  CreditCard,
  Search,
  ChevronRight,
  LogOut,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsSection = 'general' | 'account' | 'security' | 'users-teams' | 'notifications' | 'appearance' | 'integrations' | 'billing';

export default function PartnerSettings() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleBackClick = () => {
    navigate('/partner/dashboard');
  };
  const [activeSection, setActiveSection] = useState<SettingsSection>('security');
  const [searchQuery, setSearchQuery] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState(true);
  const [reauthRequired, setReauthRequired] = useState(true);
  const [ipRestrictionEnabled, setIpRestrictionEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');

  const sections = [
    { id: 'general' as const, label: 'General', icon: SettingsIcon },
    { id: 'account' as const, label: 'Account', icon: SettingsIcon },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'integrations' as const, label: 'Integrations', icon: Zap },
    { id: 'billing' as const, label: 'Billing', icon: CreditCard },
  ];

  const handleSaveChanges = () => {
    setSaveMessage('Changes saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
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

  const RadioButton = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={cn(
        'relative inline-flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors',
        checked ? 'border-blue-600 bg-blue-600' : 'border-slate-400'
      )}
    >
      {checked && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
    </button>
  );

  const SettingCard = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
    <div className="rounded-xl border border-border bg-card p-4 transition-colors md:p-6">
      <h3 className="mb-1 text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mb-4 text-sm text-slate-500">{description}</p>}
      {children}
    </div>
  );

  const SettingRow = ({ label, hint, control }: { label: string; hint?: string; control: React.ReactNode }) => (
    <div className="flex flex-col gap-3 border-b border-border/60 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      <div className="sm:ml-4">{control}</div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-4">
            <SettingCard title="Workspace Settings" description="Manage your workspace configuration">
              <SettingRow
                label="Business Name"
                hint="Your partner company name"
                control={<input type="text" defaultValue="Partner Co." className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" />}
              />
            </SettingCard>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-4">
            <SettingCard title="Profile Information" description="Update your personal information">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Full Name</label>
                  <input type="text" defaultValue={user?.name} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                  <input type="email" defaultValue={user?.email} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" disabled />
                </div>
              </div>
            </SettingCard>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <SettingCard
              title="Two-Factor Authentication"
              description="Add an extra layer of security to your account"
            >
              <SettingRow
                label="2FA Status"
                hint="Enable two-factor authentication"
                control={<ToggleSwitch checked={twoFactorEnabled} onChange={setTwoFactorEnabled} />}
              />
            </SettingCard>

            <SettingCard title="Active Sessions">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 text-xs font-medium text-slate-400">Device</th>
                    <th className="text-left py-3 text-xs font-medium text-slate-400">Location</th>
                    <th className="text-left py-3 text-xs font-medium text-slate-400">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-700">
                    <td className="py-3">💻 Chrome on macOS</td>
                    <td>San Francisco, CA</td>
                    <td>5 minutes ago</td>
                  </tr>
                </tbody>
              </table>
            </SettingCard>

            <SettingCard title="Login Restrictions">
              <SettingRow label="Session timeout" control={<ToggleSwitch checked={sessionTimeoutEnabled} onChange={setSessionTimeoutEnabled} />} />
              <SettingRow label="Require re-authentication" control={<ToggleSwitch checked={reauthRequired} onChange={setReauthRequired} />} />
            </SettingCard>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <SettingCard title="Notification Preferences">
              <SettingRow label="Email Notifications" control={<ToggleSwitch checked={emailNotifications} onChange={setEmailNotifications} />} />
              <SettingRow label="Project Updates" control={<ToggleSwitch checked={true} onChange={() => {}} />} />
              <SettingRow label="Payment Alerts" control={<ToggleSwitch checked={true} onChange={() => {}} />} />
            </SettingCard>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-4">
            <SettingCard title="Theme">
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-slate-700 transition-colors">
                  <RadioButton checked={darkMode} onChange={() => setDarkMode(true)} />
                  <div>
                    <p className="text-sm font-medium text-white">Dark</p>
                    <p className="text-xs text-slate-400">Dark mode with blue accents</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-slate-700 transition-colors">
                  <RadioButton checked={!darkMode} onChange={() => setDarkMode(false)} />
                  <div>
                    <p className="text-sm font-medium text-white">Light</p>
                    <p className="text-xs text-slate-400">Light mode for daytime</p>
                  </div>
                </label>
              </div>
            </SettingCard>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-4">
            <SettingCard title="Connected Services">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-slate-700 rounded">
                  <div>
                    <p className="text-sm font-medium text-white">Slack</p>
                    <p className="text-xs text-slate-400">Workspace: partner-org</p>
                  </div>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">Manage</button>
                </div>
              </div>
            </SettingCard>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-4">
            <SettingCard title="Earnings">
              <SettingRow label="Total Earnings" control={<span className="text-white font-semibold">$5,240.50</span>} />
              <SettingRow label="Current Month" control={<span className="text-blue-400 font-semibold">$420.00</span>} />
            </SettingCard>
            <SettingCard title="Payment Method">
              <SettingRow label="Account" control={<span className="text-white font-medium">Bank ending in 4242</span>} />
              <SettingRow label="Next Payout" control={<span className="text-slate-400">May 15, 2026</span>} />
            </SettingCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarLayout>
      {/* Back Navigation - Mobile Friendly */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 lg:hidden">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={handleBackClick}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors -ml-2"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-semibold text-base leading-tight text-gray-900">Settings</h1>
            <p className="text-xs text-gray-400 leading-tight">Account & Preferences</p>
          </div>
        </div>
      </div>
      <div className="min-h-screen bg-gray-50 p-3 text-slate-900 sm:p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl space-y-4 md:space-y-6">
          <div className="rounded-2xl border border-border bg-slate-900 p-4 md:p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight md:text-2xl">Partner Settings</h1>
                <p className="mt-1 text-sm text-slate-400">
                  Manage your profile, security preferences, and payout configuration.
                </p>
              </div>
              <button
                onClick={handleSaveChanges}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:w-auto"
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
                        ? 'border-blue-500 bg-blue-600/15 text-white'
                        : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {section.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-700 px-3 py-2">Signed in as {user?.name || 'Partner'}</div>
              <div className="rounded-lg border border-slate-700 px-3 py-2 capitalize">Current section: {activeSection.replace('-', ' ')}</div>
              <button
                onClick={logout}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 font-medium text-red-400 transition-colors hover:bg-red-950 hover:text-red-300"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>

            {saveMessage && (
              <div className="mt-4 rounded-md border border-green-700 bg-green-900 px-3 py-2 text-sm text-green-200">
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
