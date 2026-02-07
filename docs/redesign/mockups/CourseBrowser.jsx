/**
 * niotebook Course Browser — Design Mockup v2.0
 *
 * Claude/Cowork-inspired design language
 * Displays course catalog with filtering and detailed course views
 */

import React, { useState } from "react";

// ============================================
// SHARED COMPONENTS (same as Dashboard)
// ============================================

const Card = ({ children, className = "", hoverable = false, onClick }) => (
  <div
    onClick={onClick}
    className={`
      bg-[#232323] border border-[#2e2e2e] rounded-lg p-5
      ${hoverable ? "hover:border-[#404040] hover:shadow-lg transition-all duration-150 cursor-pointer" : ""}
      ${className}
    `}
  >
    {children}
  </div>
);

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  active = false,
}) => {
  const variants = {
    primary: "bg-[#d97706] hover:bg-[#f59e0b] text-[#1a1a1a] font-medium",
    secondary:
      "bg-[#2a2a2a] hover:bg-[#333333] text-[#f5f5f5] border border-[#2e2e2e] hover:border-[#404040]",
    ghost: `bg-transparent hover:bg-[#333333] ${active ? "text-[#d97706] bg-[rgba(217,119,6,0.15)]" : "text-[#a3a3a3] hover:text-[#f5f5f5]"}`,
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button
      className={`rounded transition-all duration-150 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-[#2a2a2a] text-[#a3a3a3]",
    accent: "bg-[rgba(217,119,6,0.15)] text-[#d97706]",
    success: "bg-[rgba(34,197,94,0.15)] text-[#22c55e]",
    new: "bg-[rgba(59,130,246,0.15)] text-[#3b82f6]",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}
    >
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
// SIDEBAR (reused from Dashboard)
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
      <NavItem icon="📚" label="Courses" active />
      <NavItem icon="🎯" label="Progress" />
      <NavItem icon="🔖" label="Bookmarks" />
      <NavItem icon="⚙️" label="Settings" />
    </nav>
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
    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-100 ${active ? "bg-[rgba(217,119,6,0.15)] text-[#d97706]" : "text-[#a3a3a3] hover:bg-[#333333] hover:text-[#f5f5f5]"}`}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </a>
);

// ============================================
// SEARCH & FILTERS
// ============================================

const SearchBar = () => (
  <div className="relative mb-6">
    <input
      type="text"
      placeholder="Search courses..."
      className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-4 py-3 pl-10 text-[#f5f5f5] text-sm placeholder-[#737373] focus:border-[#d97706] focus:outline-none focus:ring-2 focus:ring-[#d97706]/20 transition-all"
    />
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]">
      🔍
    </span>
  </div>
);

const FilterTabs = ({ active, onChange }) => {
  const tabs = ["All", "Python", "JavaScript", "SQL", "React", "Data Science"];
  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {tabs.map((tab) => (
        <Button
          key={tab}
          variant="ghost"
          size="sm"
          active={active === tab}
          onClick={() => onChange(tab)}
        >
          {tab}
        </Button>
      ))}
    </div>
  );
};

const SortDropdown = () => (
  <div className="flex items-center gap-2 text-sm">
    <span className="text-[#737373]">Sort by:</span>
    <select className="bg-[#2a2a2a] border border-[#2e2e2e] rounded px-3 py-1.5 text-[#f5f5f5] text-sm focus:border-[#d97706] focus:outline-none cursor-pointer">
      <option>Most Popular</option>
      <option>Newest</option>
      <option>Shortest</option>
      <option>Longest</option>
    </select>
  </div>
);

// ============================================
// COURSE CARDS
// ============================================

const CourseCardLarge = ({ course, onSelect }) => (
  <Card hoverable onClick={() => onSelect(course)} className="flex gap-5">
    {/* Thumbnail */}
    <div className="w-48 h-32 rounded-md bg-[#2a2a2a] flex items-center justify-center text-5xl shrink-0">
      {course.emoji}
    </div>

    {/* Content */}
    <div className="flex-1 flex flex-col justify-between py-1">
      <div>
        <div className="flex items-center gap-2 mb-2">
          {course.isNew && <Badge variant="new">New</Badge>}
          <Badge>{course.level}</Badge>
        </div>
        <h3 className="text-lg font-semibold text-[#f5f5f5] mb-1">
          {course.title}
        </h3>
        <p className="text-sm text-[#a3a3a3] line-clamp-2">
          {course.description}
        </p>
      </div>

      <div className="flex items-center gap-4 text-xs text-[#737373]">
        <span>📖 {course.lessons} lessons</span>
        <span>⏱️ {course.duration}</span>
        <span>👤 {course.students.toLocaleString()} students</span>
      </div>
    </div>

    {/* Progress / Action */}
    <div className="flex flex-col justify-between items-end py-1">
      {course.progress !== undefined ? (
        <>
          <div className="text-right">
            <div className="text-xs text-[#737373] mb-1">Progress</div>
            <div className="text-lg font-semibold text-[#d97706]">
              {course.progress}%
            </div>
          </div>
          <Button variant="primary" size="sm">
            Continue
          </Button>
        </>
      ) : (
        <>
          <div className="text-right">
            <div className="text-xs text-[#737373]">Rating</div>
            <div className="text-sm text-[#f5f5f5]">⭐ {course.rating}</div>
          </div>
          <Button variant="secondary" size="sm">
            Start
          </Button>
        </>
      )}
    </div>
  </Card>
);

// ============================================
// COURSE DETAIL PANEL (Slide-over)
// ============================================

const CourseDetailPanel = ({ course, onClose }) => {
  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-[500px] bg-[#1a1a1a] border-l border-[#2e2e2e] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2e2e2e] p-6 flex items-start justify-between">
          <div>
            <Badge>{course.level}</Badge>
            <h2 className="text-xl font-bold text-[#f5f5f5] mt-2">
              {course.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-[#f5f5f5] text-xl"
          >
            ✕
          </button>
        </div>

        {/* Thumbnail */}
        <div className="aspect-video bg-[#232323] flex items-center justify-center text-6xl">
          {course.emoji}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-[#232323] rounded-lg">
              <div className="text-lg font-semibold text-[#f5f5f5]">
                {course.lessons}
              </div>
              <div className="text-xs text-[#737373]">Lessons</div>
            </div>
            <div className="text-center p-3 bg-[#232323] rounded-lg">
              <div className="text-lg font-semibold text-[#f5f5f5]">
                {course.duration}
              </div>
              <div className="text-xs text-[#737373]">Duration</div>
            </div>
            <div className="text-center p-3 bg-[#232323] rounded-lg">
              <div className="text-lg font-semibold text-[#f5f5f5]">
                ⭐ {course.rating}
              </div>
              <div className="text-xs text-[#737373]">Rating</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f5] mb-2">
              About this course
            </h3>
            <p className="text-sm text-[#a3a3a3] leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* What you'll learn */}
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3">
              What you&apos;ll learn
            </h3>
            <ul className="space-y-2">
              {course.learnings?.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-[#a3a3a3]"
                >
                  <span className="text-[#22c55e]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Lessons Preview */}
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3">
              Course Content
            </h3>
            <div className="space-y-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#232323] cursor-pointer transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center text-xs text-[#737373]">
                    {i}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-[#f5f5f5]">
                      Lesson {i}: Introduction to {course.title.split(" ")[0]}
                    </div>
                    <div className="text-xs text-[#737373]">12 min</div>
                  </div>
                  <span className="text-[#737373]">▶</span>
                </div>
              ))}
              <div className="text-center py-2">
                <Button variant="ghost" size="sm">
                  Show all {course.lessons} lessons
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-[#2e2e2e] p-6">
          <Button variant="primary" size="lg" className="w-full">
            {course.progress !== undefined
              ? "Continue Learning"
              : "Start Course"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COURSE BROWSER
// ============================================

export default function CourseBrowser() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const courses = [
    {
      emoji: "🐍",
      title: "Python Fundamentals",
      description:
        "Master Python from scratch. Learn variables, data types, control flow, functions, and object-oriented programming with hands-on exercises.",
      level: "Beginner",
      lessons: 24,
      duration: "4h 30m",
      students: 12500,
      rating: 4.9,
      progress: 65,
      learnings: [
        "Write clean, efficient Python code",
        "Understand data types and structures",
        "Build real-world projects",
        "Debug and test your code",
      ],
    },
    {
      emoji: "⚛️",
      title: "React for Beginners",
      description:
        "Build modern web applications with React. Learn components, hooks, state management, and best practices for scalable apps.",
      level: "Intermediate",
      lessons: 18,
      duration: "3h 15m",
      students: 8300,
      rating: 4.8,
      progress: 40,
      learnings: [
        "Build reusable React components",
        "Manage state with hooks",
        "Handle side effects properly",
        "Create production-ready apps",
      ],
    },
    {
      emoji: "🗄️",
      title: "SQL Essentials",
      description:
        "Learn SQL from the ground up. Write queries, join tables, aggregate data, and understand database design principles.",
      level: "Beginner",
      lessons: 12,
      duration: "2h 45m",
      students: 15200,
      rating: 4.7,
      isNew: true,
      learnings: [
        "Write complex SQL queries",
        "Join and aggregate data",
        "Design efficient schemas",
        "Optimize query performance",
      ],
    },
    {
      emoji: "📊",
      title: "Data Visualization with Python",
      description:
        "Create stunning visualizations with matplotlib, seaborn, and plotly. Turn data into compelling stories.",
      level: "Intermediate",
      lessons: 15,
      duration: "2h 30m",
      students: 6400,
      rating: 4.6,
      learnings: [
        "Create publication-quality charts",
        "Choose the right visualization",
        "Build interactive dashboards",
        "Tell stories with data",
      ],
    },
    {
      emoji: "🤖",
      title: "Intro to Machine Learning",
      description:
        "Understand the fundamentals of ML. Learn about algorithms, model training, evaluation, and practical applications.",
      level: "Advanced",
      lessons: 20,
      duration: "4h 00m",
      students: 9800,
      rating: 4.9,
      isNew: true,
      learnings: [
        "Understand ML fundamentals",
        "Train and evaluate models",
        "Apply ML to real problems",
        "Avoid common pitfalls",
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#1a1a1a] text-[#f5f5f5] font-sans">
      <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#f5f5f5]">Courses</h1>
              <p className="text-[#a3a3a3]">
                Explore our library of interactive coding courses
              </p>
            </div>
            <SortDropdown />
          </div>

          {/* Search */}
          <SearchBar />

          {/* Filters */}
          <FilterTabs active={activeFilter} onChange={setActiveFilter} />

          {/* Course List */}
          <div className="space-y-4">
            {courses.map((course, i) => (
              <CourseCardLarge
                key={i}
                course={course}
                onSelect={setSelectedCourse}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Detail Panel */}
      <CourseDetailPanel
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
      />
    </div>
  );
}
