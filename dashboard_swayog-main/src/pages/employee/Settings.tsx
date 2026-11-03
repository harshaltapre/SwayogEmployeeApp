import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import {
  Settings as SettingsIcon,
  Shield,
  Palette,
  Info,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsSection = 'profile' | 'general' | 'appearance' | 'privacy' | 'about';
type ThemeMode = 'light' | 'dark' | 'system';

export default function EmployeeSettings() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState('');

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as ThemeMode) || 'system';
    setTheme(savedTheme);
    applyTheme(savedTheme);
    
    // Load saved profile photo from localStorage
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
      // system mode
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setSaveMessage('File size exceeds 2MB limit');
        setTimeout(() => setSaveMessage(''), 3000);
        return;
      }
      
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        setSaveMessage('Only JPG, PNG, and GIF formats are supported');
        setTimeout(() => setSaveMessage(''), 3000);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoData = event.target?.result as string;
        setProfilePhotoPreview(photoData);
        
        // Save to localStorage with user ID as key
        localStorage.setItem(`profilePhoto_${user?.id}`, photoData);
        setSaveMessage('✓ Profile photo uploaded successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const sections = [
    { id: 'profile' as const, label: 'Profile', icon: SettingsIcon },
    { id: 'general' as const, label: 'General Settings', icon: SettingsIcon },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'privacy' as const, label: 'Privacy & Policy', icon: Shield },
    { id: 'about' as const, label: 'About', icon: Info },
  ];

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

  const SettingCard = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{description}</p>}
      {children}
    </div>
  );

  const SettingRow = ({ label, hint, control }: { label: string; hint?: string; control: React.ReactNode }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{hint}</p>}
      </div>
      <div className="ml-4">{control}</div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-4">
            <SettingCard title="Profile Photo" description="Update your profile picture">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img
                    src={profilePhotoPreview || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                    alt="Profile"
                    className="w-24 h-24 rounded-lg object-cover border-2 border-slate-200 dark:border-slate-700"
                  />
                  <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Upload a square image (JPG, PNG, GIF). Max 2MB.
                  </p>
                </div>
              </div>
            </SettingCard>

            <SettingCard title="Personal Information" description="Your profile details">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name || ''}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-900 dark:text-white disabled:opacity-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Designation</label>
                  <input
                    type="text"
                    defaultValue={user?.designation || 'Employee'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Department</label>
                  <input
                    type="text"
                    defaultValue={user?.department || 'Engineering'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveChanges}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Save Profile
                </button>
              </div>
            </SettingCard>
          </div>
        );

      case 'general':
        return (
          <div className="space-y-4">
            <SettingCard title="Work Preferences" description="Manage your work settings">
              <SettingRow
                label="Employee ID"
                control={<span className="text-slate-900 dark:text-white font-medium">{user?.id || 'EMP-001'}</span>}
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Language</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Marathi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Time Zone</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                <label className="flex items-center gap-4 p-4 rounded-lg border-2 transition-colors cursor-pointer" style={{
                  borderColor: theme === 'light' ? '#3b82f6' : undefined,
                  backgroundColor: theme === 'light' ? 'rgba(59, 130, 246, 0.05)' : undefined
                }}>
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={theme === 'light'}
                    onChange={(e) => handleThemeChange(e.target.value as ThemeMode)}
                    className="w-5 h-5 accent-blue-600"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <Sun className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Light Mode</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Bright and easy to read</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 rounded-lg border-2 transition-colors cursor-pointer" style={{
                  borderColor: theme === 'dark' ? '#3b82f6' : undefined,
                  backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.05)' : undefined
                }}>
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={theme === 'dark'}
                    onChange={(e) => handleThemeChange(e.target.value as ThemeMode)}
                    className="w-5 h-5 accent-blue-600"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <Moon className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Dark Mode</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Easy on the eyes at night</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 rounded-lg border-2 transition-colors cursor-pointer" style={{
                  borderColor: theme === 'system' ? '#3b82f6' : undefined,
                  backgroundColor: theme === 'system' ? 'rgba(59, 130, 246, 0.05)' : undefined
                }}>
                  <input
                    type="radio"
                    name="theme"
                    value="system"
                    checked={theme === 'system'}
                    onChange={(e) => handleThemeChange(e.target.value as ThemeMode)}
                    className="w-5 h-5 accent-blue-600"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <Monitor className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">System Mode</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Follow your device settings (Currently: {isDarkMode ? 'Dark' : 'Light'})</p>
                    </div>
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
    <SidebarLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <div className="flex h-full">
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto flex flex-col">
            <div className="p-6">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6">Settings</h2>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                        activeSection === section.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="flex-1" />
            <div className="p-6 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Top Bar */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {sections.find(s => s.id === activeSection)?.label || 'Settings'}
                </h1>
              </div>
              <button
                onClick={handleSaveChanges}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {saveMessage && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-lg text-sm font-medium flex items-center gap-2">
                  <span>✓</span>
                  {saveMessage}
                </div>
              )}
              {renderSection()}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
