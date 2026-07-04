  import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
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
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarLayout } from '@/components/SidebarLayout';

type SettingsSection = 'general' | 'account' | 'security' | 'notifications' | 'appearance' | 'billing';
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
  const [savedCards, setSavedCards] = useState<PaymentCard[]>(() => [
    {
      name: user?.name || 'Customer',
      number: '4242 4242 4242 4242',
      expiry: '12/2026',
      brand: 'Visa',
    },
  ]);
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

  const handleAddCard = (event: FormEvent<HTMLFormElement>) => {
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

  const handleProfilePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
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

    try {
      const imageData = await normalizeProfilePhoto(file);
      setProfilePhotoPreview(imageData);
      localStorage.setItem(`customerProfilePhoto_${user?.id}`, imageData);
      setSaveMessage('Profile photo uploaded successfully!');
    } catch {
      setSaveMessage('Unable to process the uploaded image. Please try a different file.');
    }

    setTimeout(() => setSaveMessage(''), 3000);
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
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? 'Disable setting' : 'Enable setting'}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
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
      type="button"
      onClick={onChange}
      className={cn(
        'relative inline-flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        checked ? 'border-blue-600 bg-blue-600' : 'border-slate-400'
      )}
    >
      {checked && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
    </button>
  );

  const SettingCard = ({ title, description, children }: { title: string; description?: string; children: ReactNode }) => (
    <div className="rounded-xl border border-border bg-card p-4 transition-colors md:p-6">
      <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description ? <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{description}</p> : null}
      {children}
    </div>
  );

  const SettingRow = ({ label, hint, control }: { label: string; hint?: string; control: ReactNode }) => (
    <div className="flex flex-col gap-3 border-b border-border/60 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        {hint ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{hint}</p> : null}
      </div>
      <div className="sm:ml-4">{control}</div>
    </div>
  );

  const renderSection = () => {
    const filteredCards = savedCards.filter((card) =>
      [card.name, card.number, card.expiry, card.brand].join(' ').toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-4">
            <SettingCard title="Account Settings" description="Manage your account configuration">
              <SettingRow
                label="Account Type"
                control={<span className="font-medium text-slate-900 dark:text-white">Residential</span>}
              />
            </SettingCard>
          </div>
        );

      case 'account':
        return (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <SettingCard title="Profile Photo" description="Upload your customer profile image">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {profilePhotoPreview ? (
                  <img
                    src={profilePhotoPreview}
                    alt="Customer profile"
                    className="h-20 w-20 rounded-full border-2 border-slate-200 object-cover dark:border-slate-700"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 text-xl font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {userInitials}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                    <Upload className="h-4 w-4" />
                    Upload Photo
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfilePhotoUpload} className="hidden" />
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">JPG, PNG, or WEBP up to 2MB. The upload will be auto-cropped and normalized.</p>
                </div>
              </div>
            </SettingCard>

            <SettingCard title="Account Summary" description="Quick details for this profile">
              <SettingRow label="Name" control={<span className="font-medium text-slate-900 dark:text-white">{user?.name || 'Customer'}</span>} />
              <SettingRow label="Email" control={<span className="font-medium text-slate-900 dark:text-white">{user?.email || 'Not available'}</span>} />
            </SettingCard>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <SettingCard title="Security Controls" description="Adjust access and session preferences">
              <SettingRow
                label="Two-factor authentication"
                hint="Require a verification code for sign-in"
                control={<ToggleSwitch checked={twoFactorEnabled} onChange={setTwoFactorEnabled} />}
              />
              <SettingRow
                label="Session timeout protection"
                hint="Expire inactive sessions automatically"
                control={<ToggleSwitch checked={sessionTimeoutEnabled} onChange={setSessionTimeoutEnabled} />}
              />
              <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Sign out everywhere</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">End all other sessions on this account.</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </SettingCard>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <SettingCard title="Notification Preferences" description="Choose how we contact you">
              <SettingRow
                label="Email notifications"
                hint="Receive order and service updates"
                control={<ToggleSwitch checked={emailNotifications} onChange={setEmailNotifications} />}
              />
              <SettingRow
                label="Security alerts"
                hint="Important login and payment notices are always enabled"
                control={<span className="text-sm font-medium text-slate-500">Always on</span>}
              />
            </SettingCard>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-4">
            <SettingCard title="Theme">
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700">
                  <RadioButton checked={theme === 'dark'} onChange={() => setTheme('dark')} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Dark</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Dark mode with blue accents</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700">
                  <RadioButton checked={theme === 'light'} onChange={() => setTheme('light')} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Light</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Light mode for daytime use</p>
                  </div>
                </label>
              </div>
            </SettingCard>

            <SettingCard title="Font Size" description="Choose your preferred text size">
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700">
                  <RadioButton checked={fontSize === 'small'} onChange={() => setFontSize('small')} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Small</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Compact text for more content on screen</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700">
                  <RadioButton checked={fontSize === 'normal'} onChange={() => setFontSize('normal')} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Normal</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Default text size</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700">
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
              <SettingRow label="Plan" control={<span className="font-medium text-slate-900 dark:text-white">Standard</span>} />
              <SettingRow label="Billing" control={<span className="text-slate-600 dark:text-slate-400">₹49/month • Renews May 15, 2026</span>} />
            </SettingCard>

            <SettingCard title="Payment Method" description="Your saved cards are stored locally on this device">
              <div className="space-y-4">
                {filteredCards.length > 0 ? (
                  filteredCards.map((card, index) => (
                    <div key={`${card.number}-${card.expiry}-${index}`} className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-5 shadow-lg dark:border-slate-700">
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
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No saved cards found.</p>
                )}
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

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Secure payment information is saved after confirmation.</p>
                  <button
                    type="submit"
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
                  <p className="text-xs text-slate-600 dark:text-slate-400">₹49.00</p>
                </div>
                <div className="text-sm">
                  <p className="text-slate-900 dark:text-white">March 2026</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">₹49.00</p>
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
    <SidebarLayout>
      <div className="text-slate-900 transition-colors dark:text-slate-50">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sub Navigation Sidebar */}
          <aside className="flex w-full flex-col border border-border bg-card rounded-xl p-4 lg:w-64 lg:shrink-0 lg:h-fit">
            <div className="p-2">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Settings Sections</h2>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const selected = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
                        selected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="border-t border-border mt-4 pt-4 p-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-500 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </aside>

          {/* Settings Content Area */}
          <div className="flex flex-1 flex-col min-w-0 gap-6">
            {/* Header bar with Search and Save Changes */}
            <div className="border border-border bg-card rounded-xl p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full max-w-md flex-1">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search settings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 focus:outline-none dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>Settings</span>
                    <ChevronRight className="h-4 w-4" />
                    <span className="capitalize text-blue-500 dark:text-blue-400 font-semibold">{activeSection.replace('-', ' ')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </div>

            {/* Save confirmation toast message */}
            {saveMessage ? (
              <div className="rounded-lg border border-green-700 bg-green-900/40 px-4 py-3 text-sm text-green-200">
                {saveMessage}
              </div>
            ) : null}

            {/* Selected tab content */}
            <div className="min-w-0">
              {renderSection()}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
