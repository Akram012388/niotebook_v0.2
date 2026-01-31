import type { VirtualFS } from "../../vfs/VirtualFS";

/**
 * Build a map of VFS file paths → content for all JS files.
 * Used to embed file contents into the require shim.
 */
function buildJsFileMap(vfs: VirtualFS): Record<string, string> {
  const jsFiles = [
    ...vfs.glob("**/*.js"),
    ...vfs.glob("**/*.mjs"),
    ...vfs.glob("**/*.cjs"),
  ];
  const map: Record<string, string> = {};
  for (const file of jsFiles) {
    map[file.path] = rewriteExternalImports(file.content);
  }
  return map;
}

const DYNAMIC_IMPORT_REGEX = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

function isExternalSpecifier(specifier: string): boolean {
  if (specifier.startsWith(".")) return false;
  if (specifier.startsWith("/")) return false;
  return true;
}

function rewriteExternalImports(code: string): string {
  return code.replace(DYNAMIC_IMPORT_REGEX, (match, specifier: string) => {
    if (!isExternalSpecifier(specifier)) {
      return match;
    }
    return `globalThis.__importExternal(${JSON.stringify(specifier)})`;
  });
}

/**
 * Resolve a require specifier to an absolute VFS path.
 * Generated as a string to be embedded in the shim.
 */
const RESOLVE_FN = `
function __resolveModule(specifier, fromPath) {
  if (specifier.startsWith("/")) return specifier;
  var base = fromPath.substring(0, fromPath.lastIndexOf("/")) || "/";
  var parts = base.split("/").filter(Boolean);
  var segs = specifier.split("/");
  for (var i = 0; i < segs.length; i++) {
    if (segs[i] === "..") parts.pop();
    else if (segs[i] !== ".") parts.push(segs[i]);
  }
  return "/" + parts.join("/");
}
`;

/**
 * Generate a `require()` shim that reads modules from the VirtualFS.
 *
 * Handles:
 * - `require('./lib')` → resolves to `/project/lib.js`
 * - `require('./lib.js')` → resolves to `/project/lib.js`
 * - Caches modules after first load (prevents re-execution)
 * - `module.exports` / `exports` pattern (CommonJS)
 *
 * @param mainPath - Absolute VFS path of the entry file (e.g. "/project/main.js")
 * @param vfs - The VirtualFS instance
 * @returns JavaScript source code to prepend before the user's main file
 */
function makeRequireShim(mainPath: string, vfs: VirtualFS): string {
  const fileMap = buildJsFileMap(vfs);

  // Don't generate a shim if there are no JS files (or only the main file)
  const otherFiles = Object.keys(fileMap).filter((p) => p !== mainPath);
  if (otherFiles.length === 0) return "";

  return `
(function() {
  var __vfs_files = ${JSON.stringify(fileMap)};
  var __module_cache = {};
  var __extensions = [".js", ".mjs", ".cjs"];
  ${RESOLVE_FN}
  function require(specifier) {
    if (typeof globalThis !== "undefined") {
      var externals = globalThis.__external_modules || {};
      if (externals[specifier]) {
        var extMod = externals[specifier];
        if (extMod && typeof extMod === "object" && "default" in extMod) {
          return extMod.default || extMod;
        }
        return extMod;
      }
    }
    var resolved = __resolveModule(specifier, ${JSON.stringify(mainPath)});
    // Try exact path, then with extensions
    var found = null;
    if (__vfs_files[resolved] !== undefined) {
      found = resolved;
    } else {
      for (var i = 0; i < __extensions.length; i++) {
        var candidate = resolved + __extensions[i];
        if (__vfs_files[candidate] !== undefined) {
          found = candidate;
          break;
        }
      }
    }
    if (found === null) {
      // Try index files
      for (var j = 0; j < __extensions.length; j++) {
        var idx = resolved + "/index" + __extensions[j];
        if (__vfs_files[idx] !== undefined) {
          found = idx;
          break;
        }
      }
    }
    if (found === null) throw new Error("Cannot find module: " + specifier);
    if (__module_cache[found]) return __module_cache[found].exports;
    var module = { exports: {} };
    __module_cache[found] = module;
    var exports = module.exports;
    (new Function("module", "exports", "require", __vfs_files[found]))(module, exports, require);
    return module.exports;
  }
  if (typeof globalThis !== "undefined") globalThis.require = require;
})();
`;
}

export { makeRequireShim };
