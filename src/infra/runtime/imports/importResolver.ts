import type { VirtualFS } from "../../vfs/VirtualFS";
import type { RuntimeLanguage } from "../types";

/**
 * A resolved import with source path, specifier, resolved VFS path, and content.
 */
type ResolvedImport = {
  /** File doing the importing */
  sourcePath: string;
  /** What was written: "utils", "./lib", "helpers.h" */
  importSpecifier: string;
  /** Resolved VFS path: "/project/utils.py" */
  resolvedPath: string;
  /** File content */
  content: string;
};

/**
 * Extension candidates per language for bare-specifier resolution.
 */
const EXTENSION_CANDIDATES: Record<RuntimeLanguage, readonly string[]> = {
  python: [".py"],
  js: [".js", ".mjs", ".cjs"],
  c: [".c", ".h"],
  html: [".html", ".htm"],
};

/**
 * Resolve an import specifier to a VFS file.
 *
 * Handles:
 * - Relative paths: `./utils`, `../lib`
 * - Extension inference: `./utils` → `./utils.py` (based on language)
 * - Absolute paths: `/project/helpers.h`
 *
 * @returns The resolved import, or `null` if the specifier cannot be found in the VFS.
 */
function resolveImport(
  specifier: string,
  fromPath: string,
  language: RuntimeLanguage,
  vfs: VirtualFS,
): ResolvedImport | null {
  // Resolve the specifier to an absolute path
  const candidateBase = specifier.startsWith("/")
    ? specifier
    : vfs.resolvePath(fromPath, specifier);

  // Try exact path first
  const exactContent = vfs.readFile(candidateBase);
  if (exactContent !== null) {
    return {
      sourcePath: fromPath,
      importSpecifier: specifier,
      resolvedPath: candidateBase,
      content: exactContent,
    };
  }

  // Try with extension candidates
  const extensions = EXTENSION_CANDIDATES[language] ?? [];
  for (const ext of extensions) {
    const withExt = candidateBase + ext;
    const content = vfs.readFile(withExt);
    if (content !== null) {
      return {
        sourcePath: fromPath,
        importSpecifier: specifier,
        resolvedPath: withExt,
        content,
      };
    }
  }

  // Try index file (for directory imports in JS)
  if (language === "js") {
    for (const ext of extensions) {
      const indexPath = candidateBase + "/index" + ext;
      const content = vfs.readFile(indexPath);
      if (content !== null) {
        return {
          sourcePath: fromPath,
          importSpecifier: specifier,
          resolvedPath: indexPath,
          content,
        };
      }
    }
  }

  // Try Python package (__init__.py)
  if (language === "python") {
    const initPath = candidateBase + "/__init__.py";
    const content = vfs.readFile(initPath);
    if (content !== null) {
      return {
        sourcePath: fromPath,
        importSpecifier: specifier,
        resolvedPath: initPath,
        content,
      };
    }
  }

  return null;
}

export { resolveImport };
export type { ResolvedImport };
