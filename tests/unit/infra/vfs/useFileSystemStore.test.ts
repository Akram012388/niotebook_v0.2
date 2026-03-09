import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LessonEnvironment } from "@/domain/lessonEnvironment";
import { VirtualFS } from "@/infra/vfs/VirtualFS";
import { useFileSystemStore } from "@/infra/vfs/useFileSystemStore";

// ---------------------------------------------------------------------------
// Mock the IndexedDB backend — tests must be deterministic and offline
// ---------------------------------------------------------------------------

vi.mock("@/infra/vfs/indexedDbBackend", () => ({
  loadProject: vi.fn().mockResolvedValue(null),
  saveProject: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset the Zustand store to a clean initial state before each test. */
function resetStore(): void {
  useFileSystemStore.setState({
    vfs: new VirtualFS(),
    projectRoot: "/project",
    files: [],
    directories: [],
    isLoaded: false,
    mainFilePath: null,
  });
}

/** Build a minimal valid LessonEnvironment for a given language. */
function makeEnv(
  id: string,
  starterFiles: Array<{ path: string; content: string }>,
): LessonEnvironment {
  return {
    id,
    name: `Env ${id}`,
    primaryLanguage: "python",
    allowedLanguages: ["python"],
    starterFiles: starterFiles.map((f) => ({
      ...f,
      readonly: false,
    })),
    packages: [],
    runtimeSettings: {
      timeoutMs: 5000,
      maxOutputBytes: 65536,
      stdinEnabled: false,
    },
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetStore();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// createFile
// ---------------------------------------------------------------------------

describe("createFile", () => {
  it("creates a file at the given path", () => {
    const { createFile } = useFileSystemStore.getState();

    const file = createFile("/project/main.py", 'print("hello")');

    expect(file.kind).toBe("file");
    expect(file.path).toBe("/project/main.py");
    expect(file.content).toBe('print("hello")');
  });

  it("adds the file to the derived files list", () => {
    useFileSystemStore.getState().createFile("/project/main.py", "x = 1");

    const { files } = useFileSystemStore.getState();
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("/project/main.py");
  });

  it("creates a file with empty content when no content is provided", () => {
    const file = useFileSystemStore.getState().createFile("/project/empty.py");

    expect(file.content).toBe("");
  });

  it("creates multiple files and all appear in the files list", () => {
    const { createFile } = useFileSystemStore.getState();
    createFile("/project/a.py", "a");
    createFile("/project/b.py", "b");

    const { files } = useFileSystemStore.getState();
    expect(files).toHaveLength(2);
    const paths = files.map((f) => f.path).sort();
    expect(paths).toEqual(["/project/a.py", "/project/b.py"]);
  });
});

// ---------------------------------------------------------------------------
// updateFile
// ---------------------------------------------------------------------------

describe("updateFile", () => {
  it("updates the content of an existing file", () => {
    const { createFile, updateFile } = useFileSystemStore.getState();
    createFile("/project/main.py", "v1");

    updateFile("/project/main.py", "v2");

    const { vfs } = useFileSystemStore.getState();
    expect(vfs.readFile("/project/main.py")).toBe("v2");
  });

  it("reflects updated content in the files list", () => {
    const { createFile, updateFile } = useFileSystemStore.getState();
    createFile("/project/script.py", "original");
    updateFile("/project/script.py", "updated");

    const { files } = useFileSystemStore.getState();
    const file = files.find((f) => f.path === "/project/script.py");
    expect(file?.content).toBe("updated");
  });
});

// ---------------------------------------------------------------------------
// deleteNode
// ---------------------------------------------------------------------------

describe("deleteNode", () => {
  it("removes the file from the files list", () => {
    const { createFile, deleteNode } = useFileSystemStore.getState();
    createFile("/project/todelete.py", "bye");

    deleteNode("/project/todelete.py");

    const { files } = useFileSystemStore.getState();
    expect(
      files.find((f) => f.path === "/project/todelete.py"),
    ).toBeUndefined();
  });

  it("clears mainFilePath when the main file is deleted", () => {
    const { createFile, setMainFile, deleteNode } =
      useFileSystemStore.getState();
    createFile("/project/main.py", "code");
    setMainFile("/project/main.py");

    deleteNode("/project/main.py");

    expect(useFileSystemStore.getState().mainFilePath).toBeNull();
  });

  it("keeps mainFilePath when a different file is deleted", () => {
    const { createFile, setMainFile, deleteNode } =
      useFileSystemStore.getState();
    createFile("/project/main.py", "code");
    createFile("/project/other.py", "other");
    setMainFile("/project/main.py");

    deleteNode("/project/other.py");

    expect(useFileSystemStore.getState().mainFilePath).toBe("/project/main.py");
  });
});

// ---------------------------------------------------------------------------
// initializeFromEnvironment
// ---------------------------------------------------------------------------

describe("initializeFromEnvironment", () => {
  it("writes all starter files into the VFS", () => {
    const env = makeEnv("cs50x-python", [
      { path: "main.py", content: "# hello" },
      { path: "utils.py", content: "# utils" },
    ]);

    useFileSystemStore.getState().initializeFromEnvironment(env);

    const { files } = useFileSystemStore.getState();
    expect(files).toHaveLength(2);
    const paths = files.map((f) => f.path).sort();
    expect(paths).toContain("/project/main.py");
    expect(paths).toContain("/project/utils.py");
  });

  it("sets isLoaded to true after initialization", () => {
    const env = makeEnv("sandbox", [{ path: "index.js", content: "" }]);

    useFileSystemStore.getState().initializeFromEnvironment(env);

    expect(useFileSystemStore.getState().isLoaded).toBe(true);
  });

  it("sets the first starter file as the main file", () => {
    const env = makeEnv("cs50x-python", [
      { path: "main.py", content: "" },
      { path: "helpers.py", content: "" },
    ]);

    useFileSystemStore.getState().initializeFromEnvironment(env);

    expect(useFileSystemStore.getState().mainFilePath).toBe("/project/main.py");
  });

  it("preserves absolute paths in starter files", () => {
    const env = makeEnv("sandbox", [
      { path: "/absolute/path/app.py", content: "# abs" },
    ]);

    useFileSystemStore.getState().initializeFromEnvironment(env);

    const { files } = useFileSystemStore.getState();
    expect(files[0].path).toBe("/absolute/path/app.py");
  });
});

// ---------------------------------------------------------------------------
// scheduleAutoPersist debounce
// ---------------------------------------------------------------------------

// Hoist the mock reference once for all debounce tests
const indexedDbBackend = await import("@/infra/vfs/indexedDbBackend");
const saveProjectMock = vi.mocked(indexedDbBackend.saveProject);

describe("scheduleAutoPersist debounce", () => {
  it("only persists once when multiple mutations occur within 500ms", async () => {
    // Load a lesson so currentLessonId is set
    await useFileSystemStore.getState().loadFromIndexedDB("lesson-42");

    saveProjectMock.mockClear();

    const { createFile } = useFileSystemStore.getState();
    createFile("/project/a.py", "a");
    createFile("/project/b.py", "b");
    createFile("/project/c.py", "c");

    // No persist yet — debounce timer still pending
    expect(saveProjectMock).not.toHaveBeenCalled();

    // Advance past the 500ms debounce window
    await vi.runAllTimersAsync();

    expect(saveProjectMock).toHaveBeenCalledTimes(1);
    expect(saveProjectMock).toHaveBeenCalledWith(
      "lesson-42",
      expect.anything(),
    );
  });

  it("resets persist count to zero after debounce window", async () => {
    // Load a lesson, then verify a second burst triggers exactly one more persist
    await useFileSystemStore.getState().loadFromIndexedDB("lesson-debounce");
    saveProjectMock.mockClear();

    // First burst
    useFileSystemStore.getState().createFile("/project/x.py", "x");
    useFileSystemStore.getState().createFile("/project/y.py", "y");

    // Advance past debounce — one persist
    await vi.runAllTimersAsync();
    expect(saveProjectMock).toHaveBeenCalledTimes(1);

    saveProjectMock.mockClear();

    // Second burst after the window has closed
    useFileSystemStore.getState().createFile("/project/z.py", "z");
    await vi.runAllTimersAsync();

    // One more persist, not accumulated
    expect(saveProjectMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Lesson-switch isolation
// ---------------------------------------------------------------------------

describe("lesson-switch isolation", () => {
  it("reinitializing for lesson B clears files from lesson A", () => {
    const envA = makeEnv("lesson-a", [
      { path: "solution.py", content: "# lesson A" },
    ]);
    const envB = makeEnv("lesson-b", [
      { path: "starter.py", content: "# lesson B" },
    ]);

    // Initialize lesson A
    useFileSystemStore.getState().initializeFromEnvironment(envA);
    expect(useFileSystemStore.getState().files).toHaveLength(1);

    // Simulate switching to lesson B: reset state then initialize B
    resetStore();
    useFileSystemStore.getState().initializeFromEnvironment(envB);

    const { files } = useFileSystemStore.getState();
    // Only lesson B's file should be present
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("/project/starter.py");
    expect(files.find((f) => f.path.includes("solution.py"))).toBeUndefined();
  });

  it("mainFilePath from lesson A is not visible after switching to lesson B", () => {
    const envA = makeEnv("lesson-a", [{ path: "main.py", content: "" }]);
    const envB = makeEnv("lesson-b", [{ path: "index.js", content: "" }]);

    useFileSystemStore.getState().initializeFromEnvironment(envA);
    expect(useFileSystemStore.getState().mainFilePath).toBe("/project/main.py");

    resetStore();
    useFileSystemStore.getState().initializeFromEnvironment(envB);

    expect(useFileSystemStore.getState().mainFilePath).toBe(
      "/project/index.js",
    );
  });
});
