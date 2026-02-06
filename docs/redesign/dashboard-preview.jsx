import React from 'react';

const Card = ({ children, className = '', hoverable = false }) => (
  <div className={`bg-[#232323] border border-[#2e2e2e] rounded-lg p-4 ${hoverable ? 'hover:border-[#404040] transition-all cursor-pointer' : ''} ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', className = '' }) => {
  const variants = {
    primary: 'bg-amber-600 hover:bg-amber-500 text-gray-900 font-medium',
    secondary: 'bg-neutral-800 hover:bg-neutral-700 text-gray-100 border border-neutral-700',
    ghost: 'bg-transparent hover:bg-neutral-800 text-neutral-400 hover:text-gray-100',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  return <button className={`rounded transition-all ${variants[variant]} ${sizes[size]} ${className}`}>{children}</button>;
};

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-neutral-800 text-neutral-400',
    accent: 'bg-amber-900/30 text-amber-500',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}>{children}</span>;
};

const ProgressBar = ({ value }) => (
  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
    <div className="h-full bg-amber-600 rounded-full" style={{ width: `${value}%` }} />
  </div>
);

const NavItem = ({ icon, label, active = false }) => (
  <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all ${active ? 'bg-amber-900/20 text-amber-500' : 'text-neutral-400 hover:bg-neutral-800 hover:text-gray-100'}`}>
    <span>{icon}</span><span>{label}</span>
  </div>
);

const StatCard = ({ label, value, trend, icon }) => (
  <Card>
    <div className="text-xs text-neutral-500 mb-1">{label}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-bold text-gray-100">{value}</span>
      {icon && <span>{icon}</span>}
    </div>
    {trend && <div className="text-xs text-green-500 mt-1">{trend}</div>}
  </Card>
);

const CourseCard = ({ emoji, title, lessons, duration, progress }) => (
  <Card hoverable>
    <div className="aspect-video rounded bg-neutral-800 mb-3 flex items-center justify-center text-3xl">{emoji}</div>
    <h3 className="text-gray-100 font-medium text-sm mb-1">{title}</h3>
    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
      <span>{lessons} lessons</span><span>•</span><span>{duration}</span>
    </div>
    {progress !== undefined ? (
      <div className="flex items-center gap-2"><ProgressBar value={progress} /><span className="text-xs text-neutral-500">{progress}%</span></div>
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
    <div className="flex h-screen bg-neutral-900 text-gray-100 font-sans text-sm">
      {/* Sidebar */}
      <aside className="w-52 bg-neutral-900 border-r border-neutral-800 p-3 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center">
            <span className="text-neutral-900 font-bold text-xs">N</span>
          </div>
          <span className="text-gray-100 font-semibold">niotebook</span>
        </div>
        <nav className="flex-1 space-y-1">
          <NavItem icon="🏠" label="Home" active />
          <NavItem icon="📚" label="Courses" />
          <NavItem icon="🎯" label="Progress" />
          <NavItem icon="🔖" label="Bookmarks" />
          <NavItem icon="⚙️" label="Settings" />
        </nav>
        <div className="pt-3 border-t border-neutral-800">
          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-800 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-xs">A</div>
            <div><div className="text-xs text-gray-100">Akram</div><div className="text-xs text-neutral-500">Pro</div></div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Welcome */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-100 mb-1">Welcome back, Akram</h1>
            <p className="text-neutral-400 text-sm">Continue where you left off</p>
          </div>

          {/* Continue Learning */}
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-100 mb-3">Continue Learning</h2>
            <Card hoverable className="flex gap-4">
              <div className="w-32 h-20 rounded bg-neutral-800 flex items-center justify-center text-2xl shrink-0">🐍</div>
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div><Badge variant="accent">Continue</Badge><h3 className="text-gray-100 font-medium mt-1">Python Fundamentals</h3><p className="text-xs text-neutral-400">Lesson 16: Working with Files</p></div>
                <div className="flex items-center gap-3"><div className="flex-1"><ProgressBar value={65} /></div><span className="text-xs text-neutral-500">65%</span></div>
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
              <h2 className="text-sm font-semibold text-gray-100">In Progress</h2>
              <Button variant="ghost" size="sm">View all →</Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {inProgress.map((c, i) => <CourseCard key={i} {...c} />)}
            </div>
          </section>

          {/* Recommended */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-100">Recommended</h2>
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
