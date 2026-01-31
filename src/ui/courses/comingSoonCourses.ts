type ComingSoonCourse = {
  title: string;
  provider: string;
  description: string;
  sourceUrl: string;
  license: string;
};

type ProviderGroup = {
  provider: string;
  courses: readonly ComingSoonCourse[];
};

const MIT_COURSES: readonly ComingSoonCourse[] = [
  {
    title: "6.100L: Intro to CS and Programming Using Python",
    provider: "MIT OpenCourseWare",
    description:
      "MIT's flagship intro-to-programming course, teaching Python from scratch with full video lectures.",
    sourceUrl:
      "https://ocw.mit.edu/courses/6-100l-introduction-to-cs-and-programming-using-python-fall-2022/",
    license: "CC BY-NC-SA 4.0",
  },
  {
    title: "6.006: Introduction to Algorithms",
    provider: "MIT OpenCourseWare",
    description:
      "Algorithmic paradigms, data structures, and mathematical modeling of computational problems.",
    sourceUrl:
      "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
    license: "CC BY-NC-SA 4.0",
  },
  {
    title: "6.042J: Mathematics for Computer Science",
    provider: "MIT OpenCourseWare",
    description:
      "Discrete mathematics for CS: proofs, graph theory, counting, and probability.",
    sourceUrl:
      "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/",
    license: "CC BY-NC-SA 4.0",
  },
];

const STANFORD_COURSES: readonly ComingSoonCourse[] = [
  {
    title: "CS106A: Programming Methodology",
    provider: "Stanford",
    description:
      "Stanford's first CS course for majors and non-majors, now taught in Python.",
    sourceUrl:
      "https://online.stanford.edu/courses/cs106a-programming-methodology",
    license: "CC BY 2.5",
  },
  {
    title: "CS106B: Programming Abstractions",
    provider: "Stanford",
    description:
      "Recursion, data abstraction, classic algorithms and data structures in C++.",
    sourceUrl:
      "https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1248/",
    license: "CC BY 2.5",
  },
];

const GOOGLE_COURSES: readonly ComingSoonCourse[] = [
  {
    title: "Google's Python Class",
    provider: "Google",
    description:
      "Free Python tutorial with written materials, video lectures, and coding exercises.",
    sourceUrl: "https://developers.google.com/edu/python",
    license: "CC BY 4.0",
  },
];

const CMU_COURSES: readonly ComingSoonCourse[] = [
  {
    title: "Principles of Computation with Python",
    provider: "Carnegie Mellon (OLI)",
    description:
      "Intro to Python covering iteration, recursion, binary data, and encryption.",
    sourceUrl:
      "https://oli.cmu.edu/courses/principles-of-computation-with-python-open-free/",
    license: "CC BY-NC-SA 4.0",
  },
];

const SAYLOR_COURSES: readonly ComingSoonCourse[] = [
  {
    title: "CS101: Introduction to Computer Science I",
    provider: "Saylor Academy",
    description:
      "Intro to CS fundamentals and programming with aggregated open resources.",
    sourceUrl: "https://learn.saylor.org/course/index.php?categoryid=9",
    license: "CC BY 3.0",
  },
];

const OTHER_COURSES: readonly ComingSoonCourse[] = [
  {
    title: "freeCodeCamp Web Dev",
    provider: "freeCodeCamp",
    description:
      "Full-stack web development curriculum with interactive challenges and projects.",
    sourceUrl: "https://www.freecodecamp.org/",
    license: "BSD 3-Clause",
  },
  {
    title: "Khan Academy Computing",
    provider: "Khan Academy",
    description:
      "Interactive computing courses covering algorithms, cryptography, and information theory.",
    sourceUrl: "https://www.khanacademy.org/computing",
    license: "CC BY-NC-SA 3.0",
  },
];

const COMING_SOON_GROUPS: readonly ProviderGroup[] = [
  { provider: "MIT OpenCourseWare", courses: MIT_COURSES },
  { provider: "Stanford", courses: STANFORD_COURSES },
  { provider: "Google", courses: GOOGLE_COURSES },
  { provider: "Carnegie Mellon (OLI)", courses: CMU_COURSES },
  { provider: "Saylor Academy", courses: SAYLOR_COURSES },
  { provider: "Other", courses: OTHER_COURSES },
];

const COMING_SOON_COURSES: readonly ComingSoonCourse[] =
  COMING_SOON_GROUPS.flatMap((g) => g.courses);

export { COMING_SOON_COURSES, COMING_SOON_GROUPS };
export type { ComingSoonCourse, ProviderGroup };
