import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import {
  Settings as SettingsIcon,
  Lock,
  Bell,
  Palette,
  CreditCard,
  Upload,
  Search,
  ChevronRight,
  LogOut,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsSection = 'general' | 'account' | 'security' | 'notifications' | 'appearance' | 'integrations' | 'billing';
type ThemeMode = 'light' | 'dark';
type FontSizeMode = 'small' | 'normal' | 'large';
type PaymentCard = {
  name: string;
  number: string;
  expiry: string;
  brand: string;
};

export default function CustomerSettings() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState<SettingsSection>('security');
  const [searchQuery, setSearchQuery] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [fontSize, setFontSize] = useState<FontSizeMode>('normal');
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [savedCards, setSavedCards] = useState<PaymentCard[]>(() => [{
    name: user?.name || 'Customer',
    number: '4242 4242 4242 4242',
    expiry: '12/2026',
    brand: 'Visa',
  }]);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    } else {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize === 'small' || savedFontSize === 'normal' || savedFontSize === 'large') {
      setFontSize(savedFontSize);
    }

    const storedCard = localStorage.getItem('customerPaymentCard');
    if (storedCard) {
      try {
        const parsedCard = JSON.parse(storedCard) as PaymentCard;
        if (parsedCard.name && parsedCard.number && parsedCard.expiry && parsedCard.brand) {
          setSavedCards([parsedCard]);
        }
      } catch {
        // Ignore invalid stored card data.
      }
    }

    const savedProfilePhoto = localStorage.getItem(`customerProfilePhoto_${user?.id}`);
    if (savedProfilePhoto) {
      setProfilePhotoPreview(savedProfilePhoto);
    }
  }, []);

  useEffect(() => {
    if (user?.name) {
      setSavedCards((currentCards) => {
        if (currentCards.length === 0) {
          return currentCards;
        }

        const [firstCard, ...restCards] = currentCards;
        if (firstCard.name !== 'Customer') {
          return currentCards;
        }

        return [{ ...firstCard, name: user.name }, ...restCards];
      });
    }
  }, [user?.name]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const fontSizeByMode: Record<FontSizeMode, string> = {
      small: '14px',
      normal: '16px',
      large: '18px',
    };

    root.style.fontSize = fontSizeByMode[fontSize];
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    if (savedCards.length > 0) {
      localStorage.setItem('customerPaymentCard', JSON.stringify(savedCards[0]));
    }
  }, [savedCards]);

  const sections = [
    { id: 'general' as const, label: 'General', icon: SettingsIcon },
    { id: 'account' as const, label: 'Account', icon: SettingsIcon },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'billing' as const, label: 'Billing', icon: CreditCard },
  ];

  const handleSaveChanges = () => {
    setSaveMessage('Changes saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleAddCard = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('cardName') || '').trim();
    const number = String(formData.get('cardNumber') || '').trim();
    const expiry = String(formData.get('cardExpiry') || '').trim();
    const cvv = String(formData.get('cardCvv') || '').trim();

    if (!name || !number || !expiry || !cvv) {
      setSaveMessage('Please fill in all card details');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    const compactNumber = number.replace(/\s+/g, '');
    const maskedLast4 = compactNumber.slice(-4).padStart(4, '•');

    setSavedCards((currentCards) => [
      {
        name,
        number: `•••• ${maskedLast4}`,
        expiry,
        brand: compactNumber.startsWith('4') ? 'Visa' : compactNumber.startsWith('5') ? 'Mastercard' : 'Card',
      },
      ...currentCards,
    ]);
    event.currentTarget.reset();
    setSaveMessage('Card added successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleRemoveCard = (cardNumber: string) => {
    setSavedCards((currentCards) => currentCards.filter((card) => card.number !== cardNumber));
    setSaveMessage('Card removed successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfilePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setSaveMessage('Profile photo must be 2MB or smaller');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setSaveMessage('Only JPG, PNG, and WEBP files are allowed');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const imageData = String(readerEvent.target?.result || '');
      if (!imageData) {
        return;
      }

      setProfilePhotoPreview(imageData);
      localStorage.setItem(`customerProfilePhoto_${user?.id}`, imageData);
      setSaveMessage('Profile photo uploaded successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  const userInitials = user?.name
    ? user.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() || '')
      .join('')
    : 'CU';

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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 transition-colors">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{description}</p>}
      {children}
    </div>
  );

  const SettingRow = ({ label, hint, control }: { label: string; hint?: string; control: React.ReactNode }) => (
    <div className="flex items-center justify-between py-4 last:border-b-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        {hint && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{hint}</p>}
      </div>
      <div className="ml-4">{control}</div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-4">
            <SettingCard title="Account Settings" description="Manage your account configuration">
              <SettingRow
                label="Account Type"
                control={<span className="text-slate-900 dark:text-white font-medium">Residential</span>}
              />
            </SettingCard>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-4">
            <SettingCard title="Profile Photo" description="Upload your customer profile image">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {profilePhotoPreview ? (
                  <img
                    src={profilePhotoPreview}
                    alt="Customer profile"
                    className="h-20 w-20 rounded-full border-2 border-slate-200 dark:border-slate-700 object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 text-xl font-semibold">
                    {userInitials}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleProfilePhotoUpload}
                    />
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">JPG, PNG or WEBP up to 2MB</p>
                </div>
              </div>
            </SettingCard>

            <SettingCard title="Profile Information" description="Update your personal information">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Full Name</label>
                  <input type="text" defaultValue={user?.name} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Email Address</label>
                  <input type="email" defaultValue={user?.email} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-900 dark:text-white" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Phone Number</label>
                  <input type="tel" placeholder="+1 (555) 000-0000" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-900 dark:text-white" />
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
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Device</th>
                    <th className="text-left py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Location</th>
                    <th className="text-left py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="py-3">💻 Chrome on macOS</td>
                    <td>San Francisco, CA</td>
                    <td>5 minutes ago</td>
                  </tr>
                </tbody>
              </table>
            </SettingCard>

            <SettingCard title="Login Restrictions">
              <SettingRow label="Session timeout" control={<ToggleSwitch checked={sessionTimeoutEnabled} onChange={setSessionTimeoutEnabled} />} />
            </SettingCard>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <SettingCard title="Notification Preferences">
              <SettingRow label="Email Notifications" control={<ToggleSwitch checked={emailNotifications} onChange={setEmailNotifications} />} />
              <SettingRow label="Service Updates" control={<ToggleSwitch checked={true} onChange={() => {}} />} />
              <SettingRow label="Billing Alerts" control={<ToggleSwitch checked={true} onChange={() => {}} />} />
              <SettingRow label="Installation Reminders" control={<ToggleSwitch checked={true} onChange={() => {}} />} />
            </SettingCard>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-4">
            <SettingCard title="Theme">
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <RadioButton checked={theme === 'dark'} onChange={() => setTheme('dark')} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Dark</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Dark mode with blue accents</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <RadioButton checked={theme === 'light'} onChange={() => setTheme('light')} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Light</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Light mode for daytime</p>
                  </div>
                </label>
              </div>
            </SettingCard>

            <SettingCard title="Font Size" description="Choose your preferred text size">
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <RadioButton checked={fontSize === 'small'} onChange={() => setFontSize('small')} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Small</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Compact text for more content on screen</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <RadioButton checked={fontSize === 'normal'} onChange={() => setFontSize('normal')} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Normal</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Default text size</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <RadioButton checked={fontSize === 'large'} onChange={() => setFontSize('large')} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Large</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Bigger text for easier reading</p>
                  </div>
                </label>
              </div>
            </SettingCard>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-4">
            <SettingCard title="Current Plan">
              <SettingRow label="Plan" control={<span className="text-slate-900 dark:text-white font-medium">Standard</span>} />
              <SettingRow label="Billing" control={<span className="text-slate-600 dark:text-slate-400">₹49/month • Renews May 15, 2026</span>} />
            </SettingCard>
            <SettingCard title="Payment Method" description="Your saved card will appear here">
              <div className="space-y-4">
                {savedCards.map((card, index) => (
                  <div key={`${card.number}-${card.expiry}-${index}`} className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-5 shadow-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">{index === 0 ? 'Primary Card' : 'Additional Card'}</p>
                        <p className="mt-3 text-xl font-semibold tracking-[0.18em] text-white">{card.number}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex h-10 w-16 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold uppercase tracking-wider text-white">
                          {card.brand}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCard(card.number)}
                          className="rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500/80"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 flex items-end justify-between gap-4 text-white">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Card Holder</p>
                        <p className="mt-1 text-sm font-medium text-white">{card.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Expires</p>
                        <p className="mt-1 text-sm font-medium text-white">{card.expiry}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SettingCard>
            <SettingCard title="Add Card" description="Add a new card for future payments">
              <form className="space-y-4" onSubmit={handleAddCard}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-900 dark:text-white">Cardholder Name</label>
                    <input
                      name="cardName"
                      type="text"
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-900 dark:text-white">Card Number</label>
                    <input
                      name="cardNumber"
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-900 dark:text-white">Expiry Date</label>
                    <input
                      name="cardExpiry"
                      type="text"
                      placeholder="12/26"
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-900 dark:text-white">CVV</label>
                    <input
                      name="cardCvv"
                      type="text"
                      placeholder="123"
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Secure payment information is saved after confirmation.</p>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Add Card
                  </button>
                </div>
              </form>
            </SettingCard>
            <SettingCard title="Invoice History">
              <div className="space-y-2">
                <div className="text-sm">
                  <p className="text-slate-900 dark:text-white">April 2026</p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">₹49.00</p>
                </div>
                <div className="text-sm">
                  <p className="text-slate-900 dark:text-white">March 2026</p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">₹49.00</p>
                </div>
              </div>
            </SettingCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors">
      <div className="flex min-h-screen">
          {/* Sidebar Navigation */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto flex flex-col">
            <div className="p-6">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Settings</h2>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                        activeSection === section.id
                          ? 'bg-blue-600 text-white'
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
            <div className="p-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-red-400 hover:text-red-300 hover:bg-red-950"
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
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search settings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-md pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span>Settings</span>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-blue-400 capitalize">{activeSection.replace('-', ' ')}</span>
                </div>
              </div>
              <button
                onClick={handleSaveChanges}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {saveMessage && (
                <div className="mb-6 p-4 bg-green-900 border border-green-700 text-green-200 rounded-lg text-sm">
                  ✓ {saveMessage}
                </div>
              )}
              {renderSection()}
            </div>
        </div>
      </div>
    </div>
  );
}
