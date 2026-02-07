/**
 * Built-in environment presets for CS50 courses and sandbox mode.
 */
import type {
  EnvPresetId,
  LessonEnvironment,
} from "../../domain/lessonEnvironment";

const ENV_PRESETS: Record<EnvPresetId, LessonEnvironment> = {
  "cs50x-c": {
    id: "cs50x-c",
    name: "CS50x · C",
    primaryLanguage: "c",
    allowedLanguages: ["c"],
    starterFiles: [
      {
        path: "/project/hello.c",
        content:
          '#include <stdio.h>\n\nint main(void)\n{\n    printf("hello, world\\n");\n}\n',
        readonly: false,
      },
    ],
    packages: [{ language: "c", name: "cs50.h" }],
    runtimeSettings: {
      timeoutMs: 10_000,
      maxOutputBytes: 1_048_576,
      stdinEnabled: true,
      compilerFlags: ["-lcs50"],
    },
  },

  "cs50x-python": {
    id: "cs50x-python",
    name: "CS50x · Python",
    primaryLanguage: "python",
    allowedLanguages: ["python"],
    starterFiles: [
      {
        path: "/project/hello.py",
        content: 'print("hello, world")\n',
        readonly: false,
      },
    ],
    packages: [{ language: "python", name: "cs50" }],
    runtimeSettings: {
      timeoutMs: 10_000,
      maxOutputBytes: 1_048_576,
      stdinEnabled: true,
    },
  },

  "cs50p-python": {
    id: "cs50p-python",
    name: "CS50P · Python",
    primaryLanguage: "python",
    allowedLanguages: ["python"],
    starterFiles: [
      {
        path: "/project/hello.py",
        content:
          'name = input("What is your name? ")\nprint(f"hello, {name}")\n',
        readonly: false,
      },
    ],
    packages: [{ language: "python", name: "cs50" }],
    runtimeSettings: {
      timeoutMs: 10_000,
      maxOutputBytes: 1_048_576,
      stdinEnabled: true,
    },
  },

  "cs50w-js": {
    id: "cs50w-js",
    name: "CS50W · JavaScript",
    primaryLanguage: "js",
    allowedLanguages: ["js", "html", "css"],
    starterFiles: [
      {
        path: "/project/index.html",
        content:
          '<!DOCTYPE html>\n<html>\n<head><title>CS50W</title></head>\n<body>\n  <h1>Hello, CS50W</h1>\n  <script src="app.js"></script>\n</body>\n</html>',
        readonly: false,
      },
      {
        path: "/project/app.js",
        content: 'console.log("Hello from CS50W");\n',
        readonly: false,
      },
    ],
    packages: [],
    runtimeSettings: {
      timeoutMs: 5_000,
      maxOutputBytes: 524_288,
      stdinEnabled: false,
    },
  },

  "cs50w-html": {
    id: "cs50w-html",
    name: "CS50W · HTML",
    primaryLanguage: "html",
    allowedLanguages: ["html", "css", "js"],
    starterFiles: [
      {
        path: "/project/index.html",
        content:
          "<!DOCTYPE html>\n<html>\n<head>\n  <title>CS50W</title>\n  <style>\n    body { font-family: sans-serif; }\n  </style>\n</head>\n<body>\n  <h1>Hello, CS50W</h1>\n</body>\n</html>",
        readonly: false,
      },
    ],
    packages: [],
    runtimeSettings: {
      timeoutMs: 5_000,
      maxOutputBytes: 524_288,
      stdinEnabled: false,
    },
  },

  "cs50ai-python": {
    id: "cs50ai-python",
    name: "CS50AI · Python",
    primaryLanguage: "python",
    allowedLanguages: ["python"],
    starterFiles: [
      {
        path: "/project/main.py",
        content:
          '"""CS50 AI — Problem Set"""\n\n\ndef main():\n    print("Hello, CS50AI")\n\n\nif __name__ == "__main__":\n    main()\n',
        readonly: false,
      },
    ],
    packages: [
      { language: "python", name: "cs50" },
      { language: "python", name: "numpy" },
    ],
    runtimeSettings: {
      timeoutMs: 30_000,
      maxOutputBytes: 1_048_576,
      stdinEnabled: true,
    },
  },

  "cs50sql-sql": {
    id: "cs50sql-sql",
    name: "CS50 SQL",
    primaryLanguage: "sql",
    allowedLanguages: ["sql"],
    starterFiles: [
      {
        path: "/project/queries.sql",
        content: "-- Write your SQL queries here\nSELECT 'hello, SQL';\n",
        readonly: false,
      },
    ],
    packages: [],
    runtimeSettings: {
      timeoutMs: 10_000,
      maxOutputBytes: 1_048_576,
      stdinEnabled: false,
    },
  },

  cs50r: {
    id: "cs50r",
    name: "CS50R",
    primaryLanguage: "r",
    allowedLanguages: ["r"],
    starterFiles: [
      {
        path: "/project/hello.R",
        content: 'cat("hello, world\\n")\n',
        readonly: false,
      },
    ],
    packages: [],
    runtimeSettings: {
      timeoutMs: 15_000,
      maxOutputBytes: 1_048_576,
      stdinEnabled: false,
    },
  },

  sandbox: {
    id: "sandbox",
    name: "Sandbox",
    primaryLanguage: "js",
    allowedLanguages: ["js", "python", "c", "html", "css", "sql", "r"],
    starterFiles: [
      {
        path: "/project/main.js",
        content: 'console.log("Hello, Niotebook");\n',
        readonly: false,
      },
    ],
    packages: [],
    runtimeSettings: {
      timeoutMs: 5_000,
      maxOutputBytes: 1_048_576,
      stdinEnabled: false,
    },
  },
};

const DEFAULT_PRESET_ID: EnvPresetId = "sandbox";

function getPreset(id: EnvPresetId): LessonEnvironment {
  return ENV_PRESETS[id];
}

function getPresetOrDefault(id: string | undefined | null): LessonEnvironment {
  if (id && id in ENV_PRESETS) {
    return ENV_PRESETS[id as EnvPresetId];
  }
  return ENV_PRESETS[DEFAULT_PRESET_ID];
}

export { DEFAULT_PRESET_ID, ENV_PRESETS, getPreset, getPresetOrDefault };
