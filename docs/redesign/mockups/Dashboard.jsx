/**
 * niotebook Dashboard/Home — Design Mockup v2.0
 *
 * Claude/Cowork-inspired design language
 * Preview: Copy this into a React playground or run in Next.js
 */

import React from 'react';

// ============================================
// DESIGN TOKENS (inline for portability)
// ============================================
const tokens = {
  colors: {
    bgBase: '#1a1a1a',
    bgSurface: '#232323',
    bgElevated: '#2a2a2a',
    bgHover: '#333333',
    textPrimary: '#f5f5f5',
    textSecondary: '#a3a3a3',
    textMuted: '#737373',
    accent: '#d97706',
    accentHover: '#f59e0b',
    accentSubtle: 'rgba(217, 119, 6, 0.15)',
    border: '#2e2e2e',
    borderStrong: '#404040',
    success: '#22c55e',
    warning: '#eab308',
  },
};

// ============================================
// BASE COMPONENTS
// ============================================

const Card = ({ children, className = '', hoverable = false }) => (
  <div
    className={`
      bg-[#232323] border border-[#2e2e2e] rounded-lg p-5
      ${hoverable ? 'hover:border-[#404040] hover:shadow-lg transition-all duration-150 cursor-pointer' : ''}
      ${className}
    `}
  >
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', className = '' }) => {
  const variants = {
    primary: 'bg-[#d97706] hover:bg-[#f59e0b] text-[#1a1a1a] font-medium',
    secondary: 'bg-[#2a2a2a] hover:bg-[#333333] text-[#f5f5f5] border border-[#2e2e2e] hover:border-[#404040]',
    ghost: 'bg-transparent hover:bg-[#333333] text-[#a3a3a3] hover:text-[#f5f5f5]',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button className={`rounded transition-all duration-150 ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-[#2a2a2a] text-[#a3a3a3]',
    accent: 'bg-[rgba(217,119,6,0.15)] text-[#d97706]',
    success: 'bg-[rgba(34,197,94,0.15)] text-[#22c55e]',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

const ProgressBar = ({ value, max = 100 }) => (
  <div className="w-full h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
    <div
      className="h-full bg-[#d97706] rounded-full transition-all duration-300"
      style={{ width: `${(value / max) * 100}%` }}
    />
  </div>
);

// ============================================
// DASHBOARD LAYOUT
// ============================================

const Sidebar = () => (
  <aside className="w-60 bg-[#1a1a1a] border-r border-[#2e2e2e] p-4 flex flex-col">
    {/* Logo */}
    <div className="flex items-center gap-2 mb-8">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d97706] to-[#f59e0b] flex items-center justify-center">
        <span className="text-[#1a1a1a] font-bold text-sm">N</span>
      </div>
      <span className="text-[#f5f5f5] font-semibold text-lg">niotebook</span>
    </div>

    {/* Navigation */}
    <nav className="flex-1 space-y-1">
      <NavItem icon="🏠" label="Home" active />
      <NavItem icon="📚" label="Courses" />
      <NavItem icon="🎯" label="Progress" />
      <NavItem icon="🔖" label="Bookmarks" />
      <NavItem icon="⚙️" label="Settings" />
    </nav>

    {/* User Section */}
    <div className="pt-4 border-t border-[#2e2e2e]">
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#333333] cursor-pointer transition-colors">
        <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-sm">
          A
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-[#f5f5f5] truncate">Akram</div>
          <div className="text-xs text-[#737373]">Pro Plan</div>
        </div>
      </div>
    </div>
  </aside>
);

const NavItem = ({ icon, label, active = false }) => (
  <a
    href="#"
    className={`
      flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-100
      ${active
        ? 'bg-[rgba(217,119,6,0.15)] text-[#d97706]'
        : 'text-[#a3a3a3] hover:bg-[#333333] hover:text-[#f5f5f5]'
      }
    `}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </a>
);

// ============================================
// MAIN CONTENT SECTIONS
// ============================================

const WelcomeHeader = () => (
  <div className="mb-8">
    <h1 className="text-2xl font-bold text-[#f5f5f5] mb-2">
      Welcome back, Akram
    </h1>
    <p className="text-[#a3a3a3]">
      Continue where you left off or explore new courses
    </p>
  </div>
);

const ContinueLearningCard = ({ course, lesson, progress }) => (
  <Card hoverable className="flex gap-4">
    {/* Thumbnail */}
    <div className="w-40 h-24 rounded-md bg-[#2a2a2a] flex items-center justify-center text-3xl">
      🐍
    </div>

    {/* Content */}
    <div className="flex-1 flex flex-col justify-between">
      <div>
        <Badge variant="accent">Continue</Badge>
        <h3 className="text-[#f5f5f5] font-semibold mt-2">{course}</h3>
        <p className="text-sm text-[#a3a3a3]">{lesson}</p>
      </div>
      <div className="flex items-center gap-4">
        <ProgressBar value={progress} />
        <span className="text-xs text-[#737373] whitespace-nowrap">{progress}%</span>
      </div>
    </div>

    {/* Action */}
    <div className="flex items-center">
      <Button variant="primary" size="sm">Resume</Button>
    </div>
  </Card>
);

const StatsGrid = () => (
  <div className="grid grid-cols-4 gap-4 mb-8">
    <StatCard label="Lessons Completed" value="24" trend="+3 this week" />
    <StatCard label="Hours Learned" value="18.5" trend="+2.5 this week" />
    <StatCard label="Current Streak" value="7 days" icon="🔥" />
    <StatCard label="Courses In Progress" value="3" />
  </div>
);

const StatCard = ({ label, value, trend, icon }) => (
  <Card>
    <div className="text-xs text-[#737373] mb-1">{label}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-[#f5f5f5]">{value}</span>
      {icon && <span>{icon}</span>}
    </div>
    {trend && <div className="text-xs text-[#22c55e] mt-1">{trend}</div>}
  </Card>
);

const CourseGrid = ({ title, courses }) => (
  <section className="mb-8">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-[#f5f5f5]">{title}</h2>
      <Button variant="ghost" size="sm">View all →</Button>
    </div>
    <div className="grid grid-cols-3 gap-4">
      {courses.map((course, i) => (
        <CourseCard key={i} {...course} />
      ))}
    </div>
  </section>
);

const CourseCard = ({ emoji, title, lessons, duration, progress }) => (
  <Card hoverable>
    {/* Thumbnail */}
    <div className="aspect-video rounded-md bg-[#2a2a2a] mb-4 flex items-center justify-center text-4xl">
      {emoji}
    </div>

    {/* Content */}
    <h3 className="text-[#f5f5f5] font-medium mb-1">{title}</h3>
    <div className="flex items-center gap-3 text-xs text-[#737373] mb-3">
      <span>{lessons} lessons</span>
      <span>•</span>
      <span>{duration}</span>
    </div>

    {/* Progress */}
    {progress !== undefined ? (
      <div className="flex items-center gap-2">
        <ProgressBar value={progress} />
        <span className="text-xs text-[#737373]">{progress}%</span>
      </div>
    ) : (
      <Button variant="secondary" size="sm" className="w-full">Start Course</Button>
    )}
  </Card>
);

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export default function Dashboard() {
  const inProgressCourses = [
    { emoji: '🐍', title: 'Python Fundamentals', lessons: 24, duration: '4h 30m', progress: 65 },
    { emoji: '⚛️', title: 'React for Beginners', lessons: 18, duration: '3h 15m', progress: 40 },
    { emoji: '🗄️', title: 'SQL Essentials', lessons: 12, duration: '2h 45m', progress: 20 },
  ];

  const recommendedCourses = [
    { emoji: '🌐', title: 'Web Development Basics', lessons: 30, duration: '5h 00m' },
    { emoji: '📊', title: 'Data Visualization', lessons: 15, duration: '2h 30m' },
    { emoji: '🤖', title: 'Intro to Machine Learning', lessons: 20, duration: '4h 00m' },
  ];

  return (
    <div className="flex min-h-screen bg-[#1a1a1a] text-[#f5f5f5] font-sans">
      <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <WelcomeHeader />

          {/* Continue Learning */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[#f5f5f5] mb-4">Continue Learning</h2>
            <ContinueLearningCard
              course="Python Fundamentals"
              lesson="Lesson 16: Working with Files"
              progress={65}
            />
          </section>

          {/* Stats */}
          <StatsGrid />

          {/* Course Grids */}
          <CourseGrid title="In Progress" courses={inProgressCourses} />
          <CourseGrid title="Recommended for You" courses={recommendedCourses} />
        </div>
      </main>
    </div>
  );
}
