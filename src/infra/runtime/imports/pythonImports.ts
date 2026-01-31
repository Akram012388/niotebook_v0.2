import type { VirtualFS } from "../../vfs/VirtualFS";

/**
 * Minimal Pyodide FS interface for mounting files.
 * Matches the subset of Pyodide's FS API we actually use.
 */
type PyodideFS = {
  writeFile: (path: string, content: string) => void;
  mkdirTree: (path: string) => void;
};

/**
 * Minimal Pyodide interface for running Python and accessing the FS.
 */
type PyodideInterface = {
  FS: PyodideFS;
  runPython: (code: string) => unknown;
  runPythonAsync?: (code: string) => Promise<unknown>;
  loadPackage?: (packages: string | string[]) => Promise<void>;
};

/** The project root path used inside Pyodide's virtual FS. */
const PYODIDE_PROJECT_ROOT = "/project";

/**
 * Mount all `.py` files from the VirtualFS into Pyodide's in-memory FS
 * and add the project root to `sys.path` so that Python imports resolve.
 *
 * Call this before executing the user's main Python file.
 *
 * For Wasmer/WASI (Phase 4): files are already mounted via vfsMount — no extra work.
 */
function mountPythonFiles(pyodide: PyodideInterface, vfs: VirtualFS): void {
  const pythonFiles = vfs.glob("**/*.py");

  if (pythonFiles.length === 0) return;

  // Ensure the project root directory exists in Pyodide FS
  pyodide.FS.mkdirTree(PYODIDE_PROJECT_ROOT);

  // Collect parent directories that need to be created
  const createdDirs = new Set<string>();

  for (const file of pythonFiles) {
    const normalized = file.path.startsWith(PYODIDE_PROJECT_ROOT)
      ? file.path.slice(PYODIDE_PROJECT_ROOT.length)
      : file.path;
    const relativePath = normalized.startsWith("/")
      ? normalized
      : `/${normalized}`;
    const pyodidePath = `${PYODIDE_PROJECT_ROOT}${relativePath}`;
    const parentDir =
      pyodidePath.slice(0, pyodidePath.lastIndexOf("/")) ||
      PYODIDE_PROJECT_ROOT;

    if (!createdDirs.has(parentDir)) {
      pyodide.FS.mkdirTree(parentDir);
      createdDirs.add(parentDir);
    }

    // Write the file into Pyodide's FS
    pyodide.FS.writeFile(pyodidePath, file.content);
  }

  // Add project root to sys.path so imports resolve
  pyodide.runPython(
    `import sys\nif "${PYODIDE_PROJECT_ROOT}" not in sys.path:\n    sys.path.insert(0, "${PYODIDE_PROJECT_ROOT}")`,
  );
}

export { mountPythonFiles, PYODIDE_PROJECT_ROOT };
export type { PyodideInterface, PyodideFS };
