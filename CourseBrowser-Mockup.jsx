import React, { useState } from 'react';

const Card = ({ children, className = '', hoverable = false, onClick }) => (
  <div onClick={onClick} className={`bg-white border border-gray-200 rounded-lg p-4 ${hoverable ? 'hover:border-gray-300 hover:shadow-md transition-all cursor-pointer' : ''} ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', className = '', active = false }) => {
  const variants = {
    primary: 'bg-amber-600 hover:bg-amber-700 text-white font-medium',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200',
    ghost: `bg-transparent hover:bg-gray-100 ${active ? 'text-amber-700 bg-amber-50' : 'text-gray-500 hover:text-gray-900'}`,
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  return <button className={`rounded transition-all ${variants[variant]} ${sizes[size]} ${className}`}>{children}</button>;
};

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    accent: 'bg-amber-100 text-amber-700',
    new: 'bg-blue-100 text-blue-700',
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

const CourseCardLarge = ({ course, onSelect }) => (
  <Card hoverable onClick={() => onSelect(course)} className="flex gap-4">
    <div className="w-36 h-24 rounded bg-gray-100 flex items-center justify-center text-4xl shrink-0">{course.emoji}</div>
    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {course.isNew && <Badge variant="new">New</Badge>}
          <Badge>{course.level}</Badge>
        </div>
        <h3 className="text-gray-900 font-semibold mb-1">{course.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-2">{course.description}</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>📖 {course.lessons}</span>
        <span>⏱️ {course.duration}</span>
        <span>👤 {course.students?.toLocaleString()}</span>
      </div>
    </div>
    <div className="flex flex-col justify-between items-end py-1 shrink-0">
      {course.progress !== undefined ? (
        <>
          <div className="text-right"><div className="text-xs text-gray-500">Progress</div><div className="text-lg font-semibold text-amber-600">{course.progress}%</div></div>
          <Button variant="primary" size="sm">Continue</Button>
        </>
      ) : (
        <>
          <div className="text-right"><div className="text-xs text-gray-500">Rating</div><div className="text-sm text-gray-900">⭐ {course.rating}</div></div>
          <Button variant="secondary" size="sm">Start</Button>
        </>
      )}
    </div>
  </Card>
);

const CourseDetailPanel = ({ course, onClose }) => {
  if (!course) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-96 bg-white border-l border-gray-200 overflow-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-start justify-between">
          <div><Badge>{course.level}</Badge><h2 className="text-lg font-bold text-gray-900 mt-2">{course.title}</h2></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-xl">✕</button>
        </div>
        <div className="aspect-video bg-gray-100 flex items-center justify-center text-5xl">{course.emoji}</div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-lg"><div className="text-lg font-semibold text-gray-900">{course.lessons}</div><div className="text-xs text-gray-500">Lessons</div></div>
            <div className="text-center p-3 bg-gray-50 rounded-lg"><div className="text-lg font-semibold text-gray-900">{course.duration}</div><div className="text-xs text-gray-500">Duration</div></div>
            <div className="text-center p-3 bg-gray-50 rounded-lg"><div className="text-lg font-semibold text-gray-900">⭐ {course.rating}</div><div className="text-xs text-gray-500">Rating</div></div>
          </div>
          <div><h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3><p className="text-xs text-gray-600 leading-relaxed">{course.description}</p></div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">What you&apos;ll learn</h3>
            <ul className="space-y-1.5">
              {['Write clean, efficient code', 'Build real-world projects', 'Debug and test effectively', 'Apply best practices'].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600"><span className="text-green-600">✓</span><span>{item}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <Button variant="primary" size="md" className="w-full">{course.progress ? 'Continue Learning' : 'Start Course'}</Button>
        </div>
      </div>
    </div>
  );
};

export default function CourseBrowser() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const filters = ['All', 'Python', 'JavaScript', 'SQL', 'React', 'Data Science'];

  const courses = [
    { emoji: '🐍', title: 'Python Fundamentals', description: 'Master Python from scratch. Learn variables, data types, control flow, functions, and OOP.', level: 'Beginner', lessons: 24, duration: '4h 30m', students: 12500, rating: 4.9, progress: 65 },
    { emoji: '⚛️', title: 'React for Beginners', description: 'Build modern web apps with React. Components, hooks, state management, and best practices.', level: 'Intermediate', lessons: 18, duration: '3h 15m', students: 8300, rating: 4.8, progress: 40 },
    { emoji: '🗄️', title: 'SQL Essentials', description: 'Learn SQL from the ground up. Write queries, join tables, aggregate data.', level: 'Beginner', lessons: 12, duration: '2h 45m', students: 15200, rating: 4.7, isNew: true },
    { emoji: '📊', title: 'Data Visualization', description: 'Create stunning visualizations with matplotlib, seaborn, and plotly.', level: 'Intermediate', lessons: 15, duration: '2h 30m', students: 6400, rating: 4.6 },
    { emoji: '🤖', title: 'Intro to Machine Learning', description: 'Understand ML fundamentals. Algorithms, model training, evaluation, and applications.', level: 'Advanced', lessons: 20, duration: '4h', students: 9800, rating: 4.9, isNew: true },
  ];

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
          <NavItem icon="📚" label="Courses" active />
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
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div><h1 className="text-xl font-bold text-gray-900">Courses</h1><p className="text-gray-500 text-xs">Explore our library of interactive coding courses</p></div>
            <select className="bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-900"><option>Most Popular</option><option>Newest</option></select>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <input type="text" placeholder="Search courses..." className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 pl-9 text-gray-900 text-sm placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {filters.map(f => <Button key={f} variant="ghost" size="sm" active={activeFilter === f} onClick={() => setActiveFilter(f)}>{f}</Button>)}
          </div>

          {/* Course List */}
          <div className="space-y-3">
            {courses.map((course, i) => <CourseCardLarge key={i} course={course} onSelect={setSelectedCourse} />)}
          </div>
        </div>
      </main>

      {/* Detail Panel */}
      <CourseDetailPanel course={selectedCourse} onClose={() => setSelectedCourse(null)} />
    </div>
  );
}
