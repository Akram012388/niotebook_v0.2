import type { VirtualFS } from "../../vfs/VirtualFS";

/**
 * Pattern matching `#include "filename"` (user includes).
 * Does NOT match `#include <filename>` (system/stdlib includes).
 */
const USER_INCLUDE_REGEX = /^(\s*#include\s+)"([^"]+)"/gm;

/**
 * Resolve all `#include "..."` directives in C source code by inlining
 * the referenced file content from the VirtualFS.
 *
 * - `#include <stdio.h>` (angle brackets) → left untouched (stdlib)
 * - `#include "helpers.h"` (quotes) → replaced with VFS file content
 *
 * This is the fallback strategy for TCC-WASM which lacks a real filesystem.
 * For Wasmer/Clang (Phase 4), files are mounted natively — no inlining needed.
 *
 * Handles recursive includes with a visited set to prevent infinite loops.
 *
 * @param code - The C source code to process
 * @param filePath - Absolute VFS path of the file being compiled (e.g. "/project/main.c")
 * @param vfs - The VirtualFS instance to read included files from
 * @returns The code with all resolvable `#include "..."` replaced inline
 */
function resolveIncludes(
  code: string,
  filePath: string,
  vfs: VirtualFS,
): string {
  const visited = new Set<string>();
  return resolveIncludesRecursive(code, filePath, vfs, visited);
}

function resolveIncludesRecursive(
  code: string,
  filePath: string,
  vfs: VirtualFS,
  visited: Set<string>,
): string {
  // Mark this file as visited to prevent circular includes
  visited.add(filePath);

  const parentDir =
    filePath.slice(0, filePath.lastIndexOf("/")) || "/";

  return code.replace(USER_INCLUDE_REGEX, (match, prefix: string, header: string) => {
    // Resolve relative to the including file's directory
    const resolvedPath = vfs.resolvePath(filePath, header);

    // Prevent circular includes
    if (visited.has(resolvedPath)) {
      return `/* circular include: ${header} */`;
    }

    const content = vfs.readFile(resolvedPath);
    if (content === null) {
      // File not found in VFS — leave the directive as-is.
      // It may be resolved by the compiler (e.g. a system-relative path).
      return match;
    }

    // Recursively resolve includes in the included file
    return resolveIncludesRecursive(content, resolvedPath, vfs, visited);
  });
}

export { resolveIncludes };
