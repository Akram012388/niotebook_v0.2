import React, { useState } from 'react';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>{children}</div>
);

const Button = ({ children, variant = 'primary', size = 'md', className = '' }) => {
  const variants = {
    primary: 'bg-amber-600 hover:bg-amber-700 text-white font-medium',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-900',
    danger: 'bg-transparent hover:bg-red-50 text-red-600 border border-red-200',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  return <button className={`rounded transition-all ${variants[variant]} ${sizes[size]} ${className}`}>{children}</button>;
};

const Input = ({ label, type = 'text', placeholder, value, helper }) => (
  <div className="space-y-1">
    {label && <label className="block text-xs font-medium text-gray-900">{label}</label>}
    <input type={type} placeholder={placeholder} defaultValue={value} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
    {helper && <p className="text-xs text-gray-500">{helper}</p>}
  </div>
);

const Toggle = ({ label, description, enabled = false }) => (
  <div className="flex items-center justify-between py-2">
    <div><div className="text-sm text-gray-900">{label}</div>{description && <div className="text-xs text-gray-500">{description}</div>}</div>
    <button className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-amber-600' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
    </button>
  </div>
);

const Select = ({ label, options, value }) => (
  <div className="space-y-1">
    {label && <label className="block text-xs font-medium text-gray-900">{label}</label>}
    <select defaultValue={value} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-amber-500 focus:outline-none cursor-pointer">
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

const NavItem = ({ icon, label, active = false }) => (
  <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all ${active ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
    <span>{icon}</span><span>{label}</span>
  </div>
);

const SettingsNav = ({ active, onChange }) => {
  const items = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'subscription', label: 'Subscription', icon: '💳' },
    { id: 'security', label: 'Security', icon: '🔒' },
  ];
  return (
    <nav className="w-40 shrink-0 space-y-1">
      {items.map(item => (
        <button key={item.id} onClick={() => onChange(item.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all ${active === item.id ? 'bg-white text-gray-900 border border-gray-200 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
          <span>{item.icon}</span><span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

const ProfileSection = () => (
  <div className="space-y-4">
    <div><h2 className="text-lg font-semibold text-gray-900">Profile</h2><p className="text-xs text-gray-500">Manage your public profile</p></div>
    <Card className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-600">A</div>
      <div><Button variant="secondary" size="sm">Upload Photo</Button><p className="text-xs text-gray-500 mt-1">JPG, PNG. Max 2MB</p></div>
    </Card>
    <Card className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-900">Basic Information</h3>
      <div className="grid grid-cols-2 gap-3"><Input label="First Name" value="Akram" /><Input label="Last Name" placeholder="Last name" /></div>
      <Input label="Email" type="email" value="akram012388@gmail.com" helper="Used for login and notifications" />
      <Input label="Username" value="akram" helper="niotebook.app/@akram" />
    </Card>
    <div className="flex justify-end"><Button variant="primary">Save Changes</Button></div>
  </div>
);

const PreferencesSection = () => (
  <div className="space-y-4">
    <div><h2 className="text-lg font-semibold text-gray-900">Preferences</h2><p className="text-xs text-gray-500">Customize your experience</p></div>
    <Card className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-900">Appearance</h3>
      <Select label="Theme" value="system" options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }]} />
      <Select label="Editor Font" value="jetbrains" options={[{ value: 'jetbrains', label: 'JetBrains Mono' }, { value: 'fira', label: 'Fira Code' }]} />
      <Select label="Font Size" value="14" options={[{ value: '12', label: '12px' }, { value: '14', label: '14px' }, { value: '16', label: '16px' }]} />
    </Card>
    <Card className="space-y-1">
      <h3 className="text-xs font-semibold text-gray-900 mb-2">Code Editor</h3>
      <Toggle label="Line Numbers" description="Show line numbers" enabled />
      <Toggle label="Word Wrap" description="Wrap long lines" />
      <Toggle label="Auto-save" description="Save as you type" enabled />
    </Card>
    <Card className="space-y-1">
      <h3 className="text-xs font-semibold text-gray-900 mb-2">AI Assistant</h3>
      <Toggle label="Auto-suggestions" description="Get AI suggestions while coding" enabled />
      <Toggle label="Explain errors" description="Auto-explain runtime errors" enabled />
    </Card>
    <div className="flex justify-end"><Button variant="primary">Save Preferences</Button></div>
  </div>
);

const SubscriptionSection = () => (
  <div className="space-y-4">
    <div><h2 className="text-lg font-semibold text-gray-900">Subscription</h2><p className="text-xs text-gray-500">Manage your plan</p></div>
    <Card className="border-amber-300 bg-amber-50/50">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2"><span className="text-lg font-semibold text-gray-900">Pro Plan</span><span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-medium">Current</span></div>
          <p className="text-xs text-gray-500">$12/month • Renews Feb 15, 2026</p>
        </div>
        <Button variant="secondary" size="sm">Manage</Button>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-amber-200">
        <div><div className="text-xl font-bold text-gray-900">∞</div><div className="text-xs text-gray-500">Courses</div></div>
        <div><div className="text-xl font-bold text-gray-900">∞</div><div className="text-xs text-gray-500">AI Messages</div></div>
        <div><div className="text-xl font-bold text-gray-900">✓</div><div className="text-xs text-gray-500">Priority Support</div></div>
      </div>
    </Card>
    <Card className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-900">Billing History</h3>
      {[{ date: 'Jan 15, 2026', amount: '$12.00' }, { date: 'Dec 15, 2025', amount: '$12.00' }].map((inv, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <div><div className="text-xs text-gray-900">{inv.date}</div><div className="text-xs text-gray-500">Pro Monthly</div></div>
          <div className="text-right"><div className="text-xs text-gray-900">{inv.amount}</div><div className="text-xs text-green-600">Paid</div></div>
        </div>
      ))}
    </Card>
  </div>
);

const SecuritySection = () => (
  <div className="space-y-4">
    <div><h2 className="text-lg font-semibold text-gray-900">Security</h2><p className="text-xs text-gray-500">Manage account security</p></div>
    <Card className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-900">Password</h3>
      <p className="text-xs text-gray-500">Last changed 3 months ago</p>
      <Button variant="secondary" size="sm">Change Password</Button>
    </Card>
    <Card>
      <h3 className="text-xs font-semibold text-gray-900 mb-2">Two-Factor Authentication</h3>
      <Toggle label="Enable 2FA" description="Require authenticator code when signing in" />
    </Card>
    <Card className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-900">Active Sessions</h3>
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2"><span>💻</span><div><div className="text-xs text-gray-900">MacBook Pro • Chrome</div><div className="text-xs text-gray-500">Current session</div></div></div>
        <span className="text-xs text-green-600">Active</span>
      </div>
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2"><span>📱</span><div><div className="text-xs text-gray-900">iPhone 15 • Safari</div><div className="text-xs text-gray-500">2 days ago</div></div></div>
        <Button variant="ghost" size="sm">Revoke</Button>
      </div>
    </Card>
    <Card className="border-red-200 bg-red-50/50">
      <h3 className="text-xs font-semibold text-red-600 mb-1">Danger Zone</h3>
      <p className="text-xs text-gray-500 mb-2">Permanently delete your account</p>
      <Button variant="danger" size="sm">Delete Account</Button>
    </Card>
  </div>
);

export default function Settings() {
  const [active, setActive] = useState('profile');
  const sections = { profile: <ProfileSection />, preferences: <PreferencesSection />, subscription: <SubscriptionSection />, security: <SecuritySection /> };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans text-sm">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-200 p-3 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center"><span className="text-white font-bold text-xs">N</span></div>
          <span className="text-gray-900 font-semibold">niotebook</span>
        </div>
        <nav className="flex-1 space-y-1">
          <NavItem icon="🏠" label="Home" />
          <NavItem icon="📚" label="Courses" />
          <NavItem icon="🎯" label="Progress" />
          <NavItem icon="🔖" label="Bookmarks" />
          <NavItem icon="⚙️" label="Settings" active />
        </nav>
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">A</div>
            <div><div className="text-xs text-gray-900">Akram</div><div className="text-xs text-gray-500">Pro</div></div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto flex gap-8">
          <SettingsNav active={active} onChange={setActive} />
          <div className="flex-1 min-w-0">{sections[active]}</div>
        </div>
      </main>
    </div>
  );
}
