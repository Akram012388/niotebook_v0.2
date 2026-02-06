/**
 * niotebook Settings/Profile — Design Mockup v2.0
 *
 * Claude/Cowork-inspired design language
 * User preferences, account settings, and profile management
 */

import React, { useState } from 'react';

// ============================================
// SHARED COMPONENTS
// ============================================

const Card = ({ children, className = '' }) => (
  <div className={`bg-[#232323] border border-[#2e2e2e] rounded-lg p-5 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', className = '', disabled = false }) => {
  const variants = {
    primary: 'bg-[#d97706] hover:bg-[#f59e0b] text-[#1a1a1a] font-medium',
    secondary: 'bg-[#2a2a2a] hover:bg-[#333333] text-[#f5f5f5] border border-[#2e2e2e] hover:border-[#404040]',
    ghost: 'bg-transparent hover:bg-[#333333] text-[#a3a3a3] hover:text-[#f5f5f5]',
    danger: 'bg-transparent hover:bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[#ef4444]/30',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      disabled={disabled}
      className={`rounded transition-all duration-150 ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, type = 'text', placeholder, value, helper, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-[#f5f5f5]">{label}</label>}
    <input
      type={type}
      placeholder={placeholder}
      defaultValue={value}
      className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-4 py-2.5 text-[#f5f5f5] text-sm placeholder-[#737373] focus:border-[#d97706] focus:outline-none focus:ring-2 focus:ring-[#d97706]/20 transition-all"
      {...props}
    />
    {helper && <p className="text-xs text-[#737373]">{helper}</p>}
  </div>
);

const Toggle = ({ label, description, enabled = false }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <div className="text-sm text-[#f5f5f5]">{label}</div>
      {description && <div className="text-xs text-[#737373]">{description}</div>}
    </div>
    <button
      className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-[#d97706]' : 'bg-[#333333]'}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : ''}`}
      />
    </button>
  </div>
);

const Select = ({ label, options, value, helper }) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-[#f5f5f5]">{label}</label>}
    <select
      defaultValue={value}
      className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-4 py-2.5 text-[#f5f5f5] text-sm focus:border-[#d97706] focus:outline-none focus:ring-2 focus:ring-[#d97706]/20 transition-all cursor-pointer"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {helper && <p className="text-xs text-[#737373]">{helper}</p>}
  </div>
);

// ============================================
// SIDEBAR
// ============================================

const Sidebar = () => (
  <aside className="w-60 bg-[#1a1a1a] border-r border-[#2e2e2e] p-4 flex flex-col">
    <div className="flex items-center gap-2 mb-8">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d97706] to-[#f59e0b] flex items-center justify-center">
        <span className="text-[#1a1a1a] font-bold text-sm">N</span>
      </div>
      <span className="text-[#f5f5f5] font-semibold text-lg">niotebook</span>
    </div>
    <nav className="flex-1 space-y-1">
      <NavItem icon="🏠" label="Home" />
      <NavItem icon="📚" label="Courses" />
      <NavItem icon="🎯" label="Progress" />
      <NavItem icon="🔖" label="Bookmarks" />
      <NavItem icon="⚙️" label="Settings" active />
    </nav>
    <div className="pt-4 border-t border-[#2e2e2e]">
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#333333] cursor-pointer transition-colors">
        <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-sm">A</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-[#f5f5f5] truncate">Akram</div>
          <div className="text-xs text-[#737373]">Pro Plan</div>
        </div>
      </div>
    </div>
  </aside>
);

const NavItem = ({ icon, label, active = false }) => (
  <a href="#" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-100 ${active ? 'bg-[rgba(217,119,6,0.15)] text-[#d97706]' : 'text-[#a3a3a3] hover:bg-[#333333] hover:text-[#f5f5f5]'}`}>
    <span>{icon}</span>
    <span>{label}</span>
  </a>
);

// ============================================
// SETTINGS SECTIONS
// ============================================

const SettingsNav = ({ active, onChange }) => {
  const items = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'subscription', label: 'Subscription', icon: '💳' },
    { id: 'security', label: 'Security', icon: '🔒' },
  ];

  return (
    <nav className="w-48 shrink-0">
      <div className="space-y-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-all ${
              active === item.id
                ? 'bg-[#232323] text-[#f5f5f5] border border-[#2e2e2e]'
                : 'text-[#a3a3a3] hover:text-[#f5f5f5]'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const ProfileSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold text-[#f5f5f5] mb-1">Profile</h2>
      <p className="text-sm text-[#a3a3a3]">Manage your public profile information</p>
    </div>

    {/* Avatar */}
    <Card>
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-[#2a2a2a] flex items-center justify-center text-3xl">
          A
        </div>
        <div className="space-y-2">
          <Button variant="secondary" size="sm">Upload Photo</Button>
          <p className="text-xs text-[#737373]">JPG, PNG. Max 2MB</p>
        </div>
      </div>
    </Card>

    {/* Basic Info */}
    <Card className="space-y-4">
      <h3 className="text-sm font-semibold text-[#f5f5f5]">Basic Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" value="Akram" />
        <Input label="Last Name" value="" placeholder="Your last name" />
      </div>
      <Input label="Email" type="email" value="akram012388@gmail.com" helper="This email is used for login and notifications" />
      <Input label="Username" value="akram" helper="Your unique profile URL: niotebook.app/@akram" />
    </Card>

    {/* Bio */}
    <Card className="space-y-4">
      <h3 className="text-sm font-semibold text-[#f5f5f5]">About</h3>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[#f5f5f5]">Bio</label>
        <textarea
          rows={3}
          placeholder="Tell us about yourself..."
          className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-4 py-2.5 text-[#f5f5f5] text-sm placeholder-[#737373] focus:border-[#d97706] focus:outline-none focus:ring-2 focus:ring-[#d97706]/20 transition-all resize-none"
        />
      </div>
      <Input label="Website" type="url" placeholder="https://yoursite.com" />
    </Card>

    <div className="flex justify-end">
      <Button variant="primary">Save Changes</Button>
    </div>
  </div>
);

const PreferencesSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold text-[#f5f5f5] mb-1">Preferences</h2>
      <p className="text-sm text-[#a3a3a3]">Customize your learning experience</p>
    </div>

    {/* Appearance */}
    <Card className="space-y-4">
      <h3 className="text-sm font-semibold text-[#f5f5f5]">Appearance</h3>
      <Select
        label="Theme"
        value="dark"
        options={[
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
          { value: 'system', label: 'System' },
        ]}
      />
      <Select
        label="Code Editor Font"
        value="jetbrains"
        options={[
          { value: 'jetbrains', label: 'JetBrains Mono' },
          { value: 'fira', label: 'Fira Code' },
          { value: 'monaco', label: 'Monaco' },
          { value: 'consolas', label: 'Consolas' },
        ]}
      />
      <Select
        label="Font Size"
        value="14"
        options={[
          { value: '12', label: '12px' },
          { value: '14', label: '14px (Default)' },
          { value: '16', label: '16px' },
          { value: '18', label: '18px' },
        ]}
      />
    </Card>

    {/* Editor */}
    <Card className="space-y-2">
      <h3 className="text-sm font-semibold text-[#f5f5f5] mb-2">Code Editor</h3>
      <Toggle label="Line Numbers" description="Show line numbers in the editor" enabled />
      <Toggle label="Word Wrap" description="Wrap long lines to fit the editor width" enabled={false} />
      <Toggle label="Minimap" description="Show code minimap on the right side" enabled={false} />
      <Toggle label="Auto-save" description="Automatically save code as you type" enabled />
    </Card>

    {/* AI Assistant */}
    <Card className="space-y-2">
      <h3 className="text-sm font-semibold text-[#f5f5f5] mb-2">AI Assistant</h3>
      <Toggle label="Auto-suggestions" description="Get AI suggestions while coding" enabled />
      <Toggle label="Explain errors" description="Automatically explain runtime errors" enabled />
      <Select
        label="Response Style"
        value="balanced"
        options={[
          { value: 'concise', label: 'Concise — Short, direct answers' },
          { value: 'balanced', label: 'Balanced — Clear explanations' },
          { value: 'detailed', label: 'Detailed — In-depth explanations' },
        ]}
      />
    </Card>

    <div className="flex justify-end">
      <Button variant="primary">Save Preferences</Button>
    </div>
  </div>
);

const NotificationsSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold text-[#f5f5f5] mb-1">Notifications</h2>
      <p className="text-sm text-[#a3a3a3]">Choose what updates you want to receive</p>
    </div>

    <Card className="space-y-2">
      <h3 className="text-sm font-semibold text-[#f5f5f5] mb-2">Email Notifications</h3>
      <Toggle label="Course updates" description="New lessons and content added to your courses" enabled />
      <Toggle label="Weekly progress" description="Summary of your learning activity" enabled />
      <Toggle label="Tips & tutorials" description="Helpful coding tips and tutorials" enabled={false} />
      <Toggle label="Product updates" description="New features and improvements" enabled={false} />
    </Card>

    <Card className="space-y-2">
      <h3 className="text-sm font-semibold text-[#f5f5f5] mb-2">In-App Notifications</h3>
      <Toggle label="Streak reminders" description="Remind you to maintain your learning streak" enabled />
      <Toggle label="Achievement badges" description="Celebrate milestones and achievements" enabled />
      <Toggle label="Course recommendations" description="Personalized course suggestions" enabled />
    </Card>

    <div className="flex justify-end">
      <Button variant="primary">Save Notifications</Button>
    </div>
  </div>
);

const SubscriptionSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold text-[#f5f5f5] mb-1">Subscription</h2>
      <p className="text-sm text-[#a3a3a3]">Manage your plan and billing</p>
    </div>

    {/* Current Plan */}
    <Card className="border-[#d97706]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-[#f5f5f5]">Pro Plan</span>
            <span className="px-2 py-0.5 bg-[rgba(217,119,6,0.15)] text-[#d97706] text-xs rounded">Current</span>
          </div>
          <p className="text-sm text-[#a3a3a3]">$12/month • Renews on Feb 15, 2026</p>
        </div>
        <Button variant="secondary" size="sm">Manage</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#2e2e2e]">
        <div>
          <div className="text-2xl font-bold text-[#f5f5f5]">∞</div>
          <div className="text-xs text-[#737373]">Courses</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-[#f5f5f5]">∞</div>
          <div className="text-xs text-[#737373]">AI Messages</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-[#f5f5f5]">✓</div>
          <div className="text-xs text-[#737373]">Priority Support</div>
        </div>
      </div>
    </Card>

    {/* Billing History */}
    <Card className="space-y-4">
      <h3 className="text-sm font-semibold text-[#f5f5f5]">Billing History</h3>
      <div className="space-y-2">
        {[
          { date: 'Jan 15, 2026', amount: '$12.00', status: 'Paid' },
          { date: 'Dec 15, 2025', amount: '$12.00', status: 'Paid' },
          { date: 'Nov 15, 2025', amount: '$12.00', status: 'Paid' },
        ].map((invoice, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-[#2e2e2e] last:border-0">
            <div>
              <div className="text-sm text-[#f5f5f5]">{invoice.date}</div>
              <div className="text-xs text-[#737373]">Pro Plan Monthly</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-[#f5f5f5]">{invoice.amount}</div>
              <div className="text-xs text-[#22c55e]">{invoice.status}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const SecuritySection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold text-[#f5f5f5] mb-1">Security</h2>
      <p className="text-sm text-[#a3a3a3]">Manage your account security settings</p>
    </div>

    <Card className="space-y-4">
      <h3 className="text-sm font-semibold text-[#f5f5f5]">Password</h3>
      <p className="text-sm text-[#a3a3a3]">Last changed 3 months ago</p>
      <Button variant="secondary" size="sm">Change Password</Button>
    </Card>

    <Card className="space-y-4">
      <h3 className="text-sm font-semibold text-[#f5f5f5]">Two-Factor Authentication</h3>
      <p className="text-sm text-[#a3a3a3]">Add an extra layer of security to your account</p>
      <Toggle label="Enable 2FA" description="Require a code from your authenticator app when signing in" enabled={false} />
    </Card>

    <Card className="space-y-4">
      <h3 className="text-sm font-semibold text-[#f5f5f5]">Active Sessions</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <span className="text-xl">💻</span>
            <div>
              <div className="text-sm text-[#f5f5f5]">MacBook Pro • Chrome</div>
              <div className="text-xs text-[#737373]">San Francisco, CA • Current session</div>
            </div>
          </div>
          <span className="text-xs text-[#22c55e]">Active</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <span className="text-xl">📱</span>
            <div>
              <div className="text-sm text-[#f5f5f5]">iPhone 15 • Safari</div>
              <div className="text-xs text-[#737373]">San Francisco, CA • 2 days ago</div>
            </div>
          </div>
          <Button variant="ghost" size="sm">Revoke</Button>
        </div>
      </div>
    </Card>

    <Card className="border-[#ef4444]/30">
      <h3 className="text-sm font-semibold text-[#ef4444] mb-2">Danger Zone</h3>
      <p className="text-sm text-[#a3a3a3] mb-4">Permanently delete your account and all associated data</p>
      <Button variant="danger" size="sm">Delete Account</Button>
    </Card>
  </div>
);

// ============================================
// MAIN SETTINGS COMPONENT
// ============================================

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile');

  const sections = {
    profile: <ProfileSection />,
    preferences: <PreferencesSection />,
    notifications: <NotificationsSection />,
    subscription: <SubscriptionSection />,
    security: <SecuritySection />,
  };

  return (
    <div className="flex min-h-screen bg-[#1a1a1a] text-[#f5f5f5] font-sans">
      <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-12">
            <SettingsNav active={activeSection} onChange={setActiveSection} />
            <div className="flex-1 min-w-0">
              {sections[activeSection]}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
