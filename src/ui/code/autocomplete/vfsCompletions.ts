/**
 * VFS-aware completions for CodeMirror 6.
 *
 * 1. Import path completions — when typing import/from/require/#include, suggest VFS filenames.
 * 2. Cross-file symbol completions — parse other open files for top-level symbols via regex.
 */
import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";

import type { VirtualFS } from "../../../infra/vfs/VirtualFS";
import type { RuntimeLanguage } from "../../../infra/runtime/types";

// ── Import path completions ─────────────────────────────────

/** Patterns that indicate the user is typing an import path. */
const IMPORT_TRIGGERS: Record<RuntimeLanguage, RegExp> = {
  python: /(?:import\s+|from\s+)(\S*)$/,
  js: /(?:import\s.*from\s+['"]|require\s*\(\s*['"])([^'"]*?)$/,
  c: /#include\s+"([^"]*?)$/,
  html: /(?:src|href)\s*=\s*['"]([^'"]*?)$/,
  css: /@import\s+(?:url\()?['"]([^'"]*?)$/,
  sql: /(?:$)^/, // SQL has no import syntax
  r: /source\(["']([^"']*?)$/,
};

function getImportCompletions(
  context: CompletionContext,
  language: RuntimeLanguage,
  vfs: VirtualFS,
  currentPath: string,
): CompletionResult | null {
  const trigger = IMPORT_TRIGGERS[language];
  if (!trigger) return null;

  const line = context.state.doc.lineAt(context.pos);
  const textBefore = line.text.slice(0, context.pos - line.from);
  const match = trigger.exec(textBefore);
  if (!match) return null;

  const partial = match[1] ?? "";
  const from = context.pos - partial.length;

  // Gather all files from VFS
  const allFiles = vfs.glob("**/*");
  const currentDir = currentPath.slice(0, currentPath.lastIndexOf("/")) || "/";

  const options: Completion[] = allFiles
    .filter((f) => f.path !== currentPath)
    .map((f) => {
      // For Python, suggest module names (without .py extension)
      if (language === "python" && f.path.endsWith(".py")) {
        const moduleName = f.name.replace(/\.py$/, "");
        return {
          label: moduleName,
          type: "module" as const,
          detail: f.path,
          boost: 5,
        };
      }

      // For C, suggest relative path from current file
      if (
        language === "c" &&
        (f.path.endsWith(".h") || f.path.endsWith(".c"))
      ) {
        const relativePath = computeRelativePath(currentDir, f.path);
        return {
          label: relativePath,
          type: "file" as const,
          detail: f.path,
          boost: 5,
        };
      }

      // For JS, suggest relative path
      if (language === "js") {
        const relativePath = computeRelativePath(currentDir, f.path);
        const label = relativePath.startsWith(".")
          ? relativePath
          : `./${relativePath}`;
        return {
          label: label.replace(/\.(js|mjs|cjs)$/, ""),
          type: "module" as const,
          detail: f.path,
          boost: 5,
        };
      }

      return {
        label: f.name,
        type: "file" as const,
        detail: f.path,
      };
    })
    .filter(
      (opt) =>
        partial.length === 0 ||
        opt.label.toLowerCase().startsWith(partial.toLowerCase()),
    );

  if (options.length === 0) return null;
  return { from, options };
}

function computeRelativePath(fromDir: string, toPath: string): string {
  const fromParts = fromDir.split("/").filter(Boolean);
  const toParts = toPath.split("/").filter(Boolean);

  let common = 0;
  while (
    common < fromParts.length &&
    common < toParts.length &&
    fromParts[common] === toParts[common]
  ) {
    common++;
  }

  const ups = fromParts.length - common;
  const rest = toParts.slice(common);
  const prefix =
    ups > 0 ? Array.from({ length: ups }, () => "..").join("/") : ".";
  return `${prefix}/${rest.join("/")}`;
}

// ── Cross-file symbol completions ───────────────────────────

type SymbolPatternFactory = {
  makeRegex: () => RegExp;
  type: Completion["type"];
};

const SYMBOL_PATTERN_FACTORIES: Record<
  RuntimeLanguage,
  SymbolPatternFactory[]
> = {
  python: [
    { makeRegex: () => /^def\s+(\w+)/gm, type: "function" },
    { makeRegex: () => /^class\s+(\w+)/gm, type: "class" },
    { makeRegex: () => /^(\w+)\s*=/gm, type: "variable" },
  ],
  js: [
    { makeRegex: () => /(?:^|\n)function\s+(\w+)/g, type: "function" },
    { makeRegex: () => /(?:^|\n)(?:const|let|var)\s+(\w+)/g, type: "variable" },
    { makeRegex: () => /(?:^|\n)class\s+(\w+)/g, type: "class" },
    {
      makeRegex: () =>
        /(?:^|\n)export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g,
      type: "function",
    },
  ],
  c: [{ makeRegex: () => /\w+\s+(\w+)\s*\(/gm, type: "function" }],
  html: [],
  css: [],
  sql: [],
  r: [{ makeRegex: () => /(?:^|\n)(\w+)\s*<-\s*function/g, type: "function" }],
};

function getCrossFileSymbolCompletions(
  context: CompletionContext,
  language: RuntimeLanguage,
  vfs: VirtualFS,
  currentPath: string,
): CompletionResult | null {
  const word = context.matchBefore(/\w+/);
  if (!word || word.from === word.to) return null;

  const factories = SYMBOL_PATTERN_FACTORIES[language];
  if (!factories || factories.length === 0) return null;

  const allFiles = vfs.glob("**/*");
  const seen = new Set<string>();
  const options: Completion[] = [];

  for (const file of allFiles) {
    if (file.path === currentPath) continue;
    if (file.language !== language) continue;

    for (const { makeRegex, type } of factories) {
      // Create a fresh regex each call to avoid lastIndex statefulness bugs
      const regex = makeRegex();
      let m: RegExpExecArray | null;
      while ((m = regex.exec(file.content)) !== null) {
        const name = m[1];
        if (name && !seen.has(name) && name.length > 1) {
          seen.add(name);
          options.push({
            label: name,
            type,
            detail: `from ${file.name}`,
            boost: 2,
          });
        }
      }
    }
  }

  if (options.length === 0) return null;
  return { from: word.from, options };
}

// ── Combined VFS completion source ──────────────────────────

function createVfsCompletionSource(
  language: RuntimeLanguage,
  vfsGetter: VirtualFS | (() => VirtualFS),
  currentPath: string,
) {
  const getVfs = typeof vfsGetter === "function" ? vfsGetter : () => vfsGetter;

  return (context: CompletionContext): CompletionResult | null => {
    const vfs = getVfs();

    // Try import completions first
    const importResult = getImportCompletions(
      context,
      language,
      vfs,
      currentPath,
    );
    if (importResult) return importResult;

    // Then cross-file symbols
    return getCrossFileSymbolCompletions(context, language, vfs, currentPath);
  };
}

export { createVfsCompletionSource };
