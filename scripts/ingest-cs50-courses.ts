/**
 * Ingest script for all 5 CS50 courses.
 *
 * Usage: npx convex run ingest:ingestCourse -- --json < scripts/data/cs50x.json
 * Or call `ingestCourse` via the dashboard/admin for each course payload below.
 *
 * This file defines the payloads for:
 *  - CS50x 2026
 *  - CS50P (Introduction to Programming with Python)
 *  - CS50AI (Introduction to Artificial Intelligence with Python)
 *  - CS50W (Web Programming with Python and JavaScript)
 *  - CS50SQL (Introduction to Databases with SQL)
 */

type EnvironmentConfig = {
  presetId: string;
  primaryLanguage: string;
  allowedLanguages: string[];
};

type LessonPayload = {
  order: number;
  title: string;
  videoId: string;
  durationSec: number;
  ingestVersion: number;
  transcriptStatus: "missing";
  environmentConfig: EnvironmentConfig;
};

type CoursePayload = {
  course: {
    sourcePlaylistId: string;
    title: string;
    description: string;
    license: string;
    sourceUrl: string;
    youtubePlaylistUrl: string;
  };
  lessons: LessonPayload[];
};

const ENV_CS50X_C: EnvironmentConfig = {
  presetId: "cs50x-c",
  primaryLanguage: "c",
  allowedLanguages: ["c"],
};

const ENV_CS50X_PYTHON: EnvironmentConfig = {
  presetId: "cs50x-python",
  primaryLanguage: "python",
  allowedLanguages: ["python"],
};

const ENV_CS50P: EnvironmentConfig = {
  presetId: "cs50p-python",
  primaryLanguage: "python",
  allowedLanguages: ["python"],
};

const ENV_CS50AI: EnvironmentConfig = {
  presetId: "cs50ai-python",
  primaryLanguage: "python",
  allowedLanguages: ["python"],
};

const ENV_CS50W_JS: EnvironmentConfig = {
  presetId: "cs50w-js",
  primaryLanguage: "js",
  allowedLanguages: ["js", "html", "css"],
};

const ENV_CS50W_HTML: EnvironmentConfig = {
  presetId: "cs50w-html",
  primaryLanguage: "html",
  allowedLanguages: ["html", "css", "js"],
};

const ENV_CS50SQL: EnvironmentConfig = {
  presetId: "cs50sql-sql",
  primaryLanguage: "python",
  allowedLanguages: ["python"],
};

// ── CS50x 2026 ──────────────────────────────────────────────
export const cs50x: CoursePayload = {
  course: {
    sourcePlaylistId: "PLhQjrBD2T383q7Wn8kB5HGr2Do7LoCMl",
    title: "CS50x 2026 — Introduction to Computer Science",
    description:
      "Harvard's introduction to the intellectual enterprises of computer science and the art of programming.",
    license: "CC BY-NC-SA 4.0",
    sourceUrl: "https://cs50.harvard.edu/x/",
    youtubePlaylistUrl:
      "https://www.youtube.com/playlist?list=PLhQjrBD2T383q7Wn8kB5HGr2Do7LoCMl",
  },
  lessons: [
    {
      order: 0,
      title: "Week 0 — Scratch",
      videoId: "3LPJfIKxwWA",
      durationSec: 6720,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50X_C,
    },
    {
      order: 1,
      title: "Week 1 — C",
      videoId: "cwtpLIWylAw",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50X_C,
    },
    {
      order: 2,
      title: "Week 2 — Arrays",
      videoId: "4vU4aEFmTSo",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50X_C,
    },
    {
      order: 3,
      title: "Week 3 — Algorithms",
      videoId: "jZzyERW7h1A",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50X_C,
    },
    {
      order: 4,
      title: "Week 4 — Memory",
      videoId: "F9-yqoS7b8w",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50X_C,
    },
    {
      order: 5,
      title: "Week 5 — Data Structures",
      videoId: "0euvEdPwQnQ",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50X_C,
    },
    {
      order: 6,
      title: "Week 6 — Python",
      videoId: "5Jppcxc1Qzc",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50X_PYTHON,
    },
    {
      order: 7,
      title: "Week 6.5 — Artificial Intelligence",
      videoId: "cGAr0PAL1kg",
      durationSec: 3600,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50X_PYTHON,
    },
    {
      order: 8,
      title: "Week 7 — SQL",
      videoId: "zrCLRC3Ci1c",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50X_PYTHON,
    },
    {
      order: 9,
      title: "Week 8 — HTML, CSS, JavaScript",
      videoId: "YWAS3mmjpds",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50X_PYTHON,
    },
    {
      order: 10,
      title: "Week 9 — Flask",
      videoId: "oVA0fceDBUY",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50X_PYTHON,
    },
    {
      order: 11,
      title: "Week 10 — Cybersecurity",
      videoId: "qlxBVwDQ6zE",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50X_PYTHON,
    },
  ],
};

// ── CS50P ───────────────────────────────────────────────────
export const cs50p: CoursePayload = {
  course: {
    sourcePlaylistId: "PLhQjrBD2T3817j24-GogXmWqO5Q5vYy0V",
    title: "CS50P — Introduction to Programming with Python",
    description:
      "An introduction to programming using Python, a popular language for general-purpose programming, data science, web programming, and more.",
    license: "CC BY-NC-SA 4.0",
    sourceUrl: "https://cs50.harvard.edu/python/",
    youtubePlaylistUrl:
      "https://www.youtube.com/playlist?list=PLhQjrBD2T3817j24-GogXmWqO5Q5vYy0V",
  },
  lessons: [
    {
      order: 0,
      title: "Lecture 0 — Functions, Variables",
      videoId: "JP7ITIXGpHk",
      durationSec: 6000,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50P,
    },
    {
      order: 1,
      title: "Lecture 1 — Conditionals",
      videoId: "ZEQh45W_UDo",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50P,
    },
    {
      order: 2,
      title: "Lecture 2 — Loops",
      videoId: "eqUwSA0xI-s",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50P,
    },
    {
      order: 3,
      title: "Lecture 3 — Exceptions",
      videoId: "LW7g1169v7w",
      durationSec: 3600,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50P,
    },
    {
      order: 4,
      title: "Lecture 4 — Libraries",
      videoId: "MztLZWibctI",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50P,
    },
    {
      order: 5,
      title: "Lecture 5 — Unit Tests",
      videoId: "tIrcxwLqzjQ",
      durationSec: 3600,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50P,
    },
    {
      order: 6,
      title: "Lecture 6 — File I/O",
      videoId: "KD-Yoel6EVQ",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50P,
    },
    {
      order: 7,
      title: "Lecture 7 — Regular Expressions",
      videoId: "hy3sd9MOAcc",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50P,
    },
    {
      order: 8,
      title: "Lecture 8 — Object-Oriented Programming",
      videoId: "e4fwY9ZsxPw",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50P,
    },
    {
      order: 9,
      title: "Lecture 9 — Et Cetera",
      videoId: "-iqf1A2-SEA",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50P,
    },
  ],
};

// ── CS50AI ──────────────────────────────────────────────────
export const cs50ai: CoursePayload = {
  course: {
    sourcePlaylistId: "PLhQjrBD2T381PopUTYtMSstgk-hsTGkVm",
    title: "CS50AI — Introduction to Artificial Intelligence with Python",
    description:
      "An introduction to the concepts and algorithms at the foundation of modern artificial intelligence.",
    license: "CC BY-NC-SA 4.0",
    sourceUrl: "https://cs50.harvard.edu/ai/",
    youtubePlaylistUrl:
      "https://www.youtube.com/playlist?list=PLhQjrBD2T381PopUTYtMSstgk-hsTGkVm",
  },
  lessons: [
    {
      order: 0,
      title: "Lecture 0 — Search",
      videoId: "D5aJNFWsWew",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50AI,
    },
    {
      order: 1,
      title: "Lecture 1 — Knowledge",
      videoId: "HWQLez87vqM",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50AI,
    },
    {
      order: 2,
      title: "Lecture 2 — Uncertainty",
      videoId: "D8RRq3TbtHU",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50AI,
    },
    {
      order: 3,
      title: "Lecture 3 — Optimization",
      videoId: "qK46ET1xk2A",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50AI,
    },
    {
      order: 4,
      title: "Lecture 4 — Learning",
      videoId: "dIBKtoDAByE",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50AI,
    },
    {
      order: 5,
      title: "Lecture 5 — Neural Networks",
      videoId: "mFZazxxCKbw",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50AI,
    },
    {
      order: 6,
      title: "Lecture 6 — Language",
      videoId: "A9pS1mNILUw",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50AI,
    },
  ],
};

// ── CS50W ───────────────────────────────────────────────────
export const cs50w: CoursePayload = {
  course: {
    sourcePlaylistId: "PLhQjrBD2T380xvFSUmToMMzERU3LBkTYy",
    title: "CS50W — Web Programming with Python and JavaScript",
    description:
      "Topics include database design, scalability, security, and user experience. Uses frameworks like Django, React, and Bootstrap.",
    license: "CC BY-NC-SA 4.0",
    sourceUrl: "https://cs50.harvard.edu/web/",
    youtubePlaylistUrl:
      "https://www.youtube.com/playlist?list=PLhQjrBD2T380xvFSUmToMMzERU3LBkTYy",
  },
  lessons: [
    {
      order: 0,
      title: "Lecture 0 — HTML, CSS",
      videoId: "zFZrkCIc2Oc",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50W_HTML,
    },
    {
      order: 1,
      title: "Lecture 1 — Git",
      videoId: "NcoBAfJ6l2Q",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50W_JS,
    },
    {
      order: 2,
      title: "Lecture 2 — Python",
      videoId: "EOLPQdVj5Ac",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50W_JS,
    },
    {
      order: 3,
      title: "Lecture 3 — Django",
      videoId: "w8q0C-C1js4",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50W_JS,
    },
    {
      order: 4,
      title: "Lecture 4 — SQL, Models, and Migrations",
      videoId: "YzP164YANAU",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50W_JS,
    },
    {
      order: 5,
      title: "Lecture 5 — JavaScript",
      videoId: "x5trGVMKTkY",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50W_JS,
    },
    {
      order: 6,
      title: "Lecture 6 — User Interfaces",
      videoId: "jrBhi8wbzPw",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50W_JS,
    },
    {
      order: 7,
      title: "Lecture 7 — Testing, CI/CD",
      videoId: "NtfbWkxJTHw",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50W_JS,
    },
    {
      order: 8,
      title: "Lecture 8 — Scalability and Security",
      videoId: "95Q-o8lfG48",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50W_JS,
    },
  ],
};

// ── CS50SQL ─────────────────────────────────────────────────
export const cs50sql: CoursePayload = {
  course: {
    sourcePlaylistId: "PLhQjrBD2T382v1MBjNOhREjMjYt0WQAz4",
    title: "CS50SQL — Introduction to Databases with SQL",
    description:
      "An introduction to databases using a language called SQL. Learn to create, read, update, and delete data with relational databases.",
    license: "CC BY-NC-SA 4.0",
    sourceUrl: "https://cs50.harvard.edu/sql/",
    youtubePlaylistUrl:
      "https://www.youtube.com/playlist?list=PLhQjrBD2T382v1MBjNOhREjMjYt0WQAz4",
  },
  lessons: [
    {
      order: 0,
      title: "Lecture 0 — Querying",
      videoId: "wdzA0gGDNtk",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50SQL,
    },
    {
      order: 1,
      title: "Lecture 1 — Relating",
      videoId: "zrCLRC3Ci1c",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50SQL,
    },
    {
      order: 2,
      title: "Lecture 2 — Designing",
      videoId: "QYd-RtK58VQ",
      durationSec: 7200,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50SQL,
    },
    {
      order: 3,
      title: "Lecture 3 — Writing",
      videoId: "BD0cD0KXNnQ",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50SQL,
    },
    {
      order: 4,
      title: "Lecture 4 — Viewing",
      videoId: "jZwW0dNSYKs",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50SQL,
    },
    {
      order: 5,
      title: "Lecture 5 — Optimizing",
      videoId: "xYBclb-sYQ4",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50SQL,
    },
    {
      order: 6,
      title: "Lecture 6 — Scaling",
      videoId: "atEEZyMrnJA",
      durationSec: 5400,
      ingestVersion: 1,
      transcriptStatus: "missing",
      environmentConfig: ENV_CS50SQL,
    },
  ],
};

export const ALL_COURSES = [cs50x, cs50p, cs50ai, cs50w, cs50sql];
