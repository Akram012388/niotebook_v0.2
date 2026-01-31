/**
 * Unified completion provider for Niotebook's CodeMirror 6 editor.
 *
 * Merges: VFS-aware completions + language builtins + code snippets
 * into a single CM6 CompletionSource per language.
 */
import type { CompletionSource } from "@codemirror/autocomplete";

import type { RuntimeLanguage } from "../../../infra/runtime/types";
import { createVfsCompletionSource } from "./vfsCompletions";
import { useFileSystemStore } from "../../../infra/vfs/useFileSystemStore";
import { pythonCompletions } from "./pythonCompletions";
import { cCompletions } from "./cCompletions";
import { jsCompletions } from "./jsCompletions";
import { createSnippetCompletionSource } from "./snippets";

const LANGUAGE_COMPLETIONS: Record<RuntimeLanguage, CompletionSource> = {
  python: pythonCompletions,
  c: cCompletions,
  js: jsCompletions,
  html: () => null, // No special HTML completions yet
  css: () => null,
};

/**
 * Creates a unified CM6 CompletionSource that merges:
 * 1. VFS-aware import path and cross-file symbol completions
 * 2. Language-specific builtin completions
 * 3. Language-specific code snippets
 *
 * Returns an array of CompletionSource functions to pass to CM6's
 * `autocompletion({ override: [...] })`.
 */
function createNiotebookCompletions(
  language: RuntimeLanguage,
  _vfs: unknown,
  currentPath: string,
): CompletionSource[] {
  const sources: CompletionSource[] = [];

  // VFS-aware completions — reads VFS lazily from the store at query time
  // to avoid stale closures when files change after editor state creation.
  sources.push(
    createVfsCompletionSource(
      language,
      () => useFileSystemStore.getState().vfs,
      currentPath,
    ),
  );

  // Language-specific builtins
  const langSource = LANGUAGE_COMPLETIONS[language];
  if (langSource) {
    sources.push(langSource);
  }

  // Code snippets
  sources.push(createSnippetCompletionSource(language));

  return sources;
}

export { createNiotebookCompletions };
