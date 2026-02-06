import React from 'react';

// Light mode design tokens
const Card = ({ children, className = '', hoverable = false }) => (
  <div className={`bg-white border border-gray-200 rounded-lg p-4 ${hoverable ? 'hover:border-gray-300 hover:shadow-md transition-all cursor-pointer' : ''} ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', className = '' }) => {
  const variants = {
    primary: 'bg-amber-600 hover:bg-amber-700 text-white font-medium',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-900',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  return <button className={`rounded transition-all ${variants[variant]} ${sizes[size]} ${className}`}>{children}</button>;
};

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    accent: 'bg-amber-100 text-amber-700',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}>{children}</span>;
};

const ProgressBar = ({ value }) => (
  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
    <div className="h-full bg-amber-600 rounded-full" style={{ width: `${value}%` }} />
  </div>
);

const NavItem = ({ icon, label, active = false }) => (
  <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all ${active ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
    <span>{icon}</span><span>{label}</span>
  </div>
);

const StatCard = ({ label, value, trend, icon }) => (
  <Card>
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-bold text-gray-900">{value}</span>
      {icon && <span>{icon}</span>}
    </div>
    {trend && <div className="text-xs text-green-600 mt-1">{trend}</div>}
  </Card>
);

const CourseCard = ({ emoji, title, lessons, duration, progress }) => (
  <Card hoverable>
    <div className="aspect-video rounded bg-gray-100 mb-3 flex items-center justify-center text-3xl">{emoji}</div>
    <h3 className="text-gray-900 font-medium text-sm mb-1">{title}</h3>
    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
      <span>{lessons} lessons</span><span>•</span><span>{duration}</span>
    </div>
    {progress !== undefined ? (
      <div className="flex items-center gap-2"><ProgressBar value={progress} /><span className="text-xs text-gray-500">{progress}%</span></div>
    ) : (
      <Button variant="secondary" size="sm" className="w-full">Start</Button>
    )}
  </Card>
);

export default function Dashboard() {
  const inProgress = [
    { emoji: '🐍', title: 'Python Fundamentals', lessons: 24, duration: '4h 30m', progress: 65 },
    { emoji: '⚛️', title: 'React Beginners', lessons: 18, duration: '3h 15m', progress: 40 },
    { emoji: '🗄️', title: 'SQL Essentials', lessons: 12, duration: '2h 45m', progress: 20 },
  ];
  const recommended = [
    { emoji: '🌐', title: 'Web Development', lessons: 30, duration: '5h' },
    { emoji: '📊', title: 'Data Visualization', lessons: 15, duration: '2h 30m' },
    { emoji: '🤖', title: 'Intro to ML', lessons: 20, duration: '4h' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans text-sm">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-200 p-3 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">N</span>
          </div>
          <span className="text-gray-900 font-semibold">niotebook</span>
        </div>
        <nav className="flex-1 space-y-1">
          <NavItem icon="🏠" label="Home" active />
          <NavItem icon="📚" label="Courses" />
          <NavItem icon="🎯" label="Progress" />
          <NavItem icon="🔖" label="Bookmarks" />
          <NavItem icon="⚙️" label="Settings" />
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
        <div className="max-w-4xl mx-auto">
          {/* Welcome */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Welcome back, Akram</h1>
            <p className="text-gray-500 text-sm">Continue where you left off</p>
          </div>

          {/* Continue Learning */}
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Continue Learning</h2>
            <Card hoverable className="flex gap-4">
              <div className="w-32 h-20 rounded bg-gray-100 flex items-center justify-center text-2xl shrink-0">🐍</div>
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div><Badge variant="accent">Continue</Badge><h3 className="text-gray-900 font-medium mt-1">Python Fundamentals</h3><p className="text-xs text-gray-500">Lesson 16: Working with Files</p></div>
                <div className="flex items-center gap-3"><div className="flex-1"><ProgressBar value={65} /></div><span className="text-xs text-gray-500">65%</span></div>
              </div>
              <div className="flex items-center shrink-0"><Button variant="primary" size="sm">Resume</Button></div>
            </Card>
          </section>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <StatCard label="Lessons" value="24" trend="+3 this week" />
            <StatCard label="Hours" value="18.5" trend="+2.5 this week" />
            <StatCard label="Streak" value="7 days" icon="🔥" />
            <StatCard label="In Progress" value="3" />
          </div>

          {/* In Progress */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">In Progress</h2>
              <Button variant="ghost" size="sm">View all →</Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {inProgress.map((c, i) => <CourseCard key={i} {...c} />)}
            </div>
          </section>

          {/* Recommended */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Recommended</h2>
              <Button variant="ghost" size="sm">View all →</Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {recommended.map((c, i) => <CourseCard key={i} {...c} />)}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
