/**
 * CodeMirror 6 extension bundles — language modes, keymaps, and themes.
 *
 * All imports here are from @codemirror/* packages which access DOM APIs.
 * This file must ONLY be reached via dynamic import (never from SSR).
 */
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import type { CompletionSource } from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import type { LanguageSupport } from "@codemirror/language";
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  EditorView,
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from "@codemirror/view";

import type { RuntimeLanguage } from "../../infra/runtime/types";

// ── Language loaders (lazy, per-file) ─────────────────────────

type LanguageLoader = () => Promise<LanguageSupport>;

const languageLoaders: Record<RuntimeLanguage, LanguageLoader> = {
  js: () =>
    import("@codemirror/lang-javascript").then((m) =>
      m.javascript({ jsx: true }),
    ),
  python: () => import("@codemirror/lang-python").then((m) => m.python()),
  html: () =>
    import("@codemirror/lang-html").then((m) =>
      m.html({ matchClosingTags: true, autoCloseTags: true }),
    ),
  c: () => import("@codemirror/lang-cpp").then((m) => m.cpp()),
  css: () => import("@codemirror/lang-css").then((m) => m.css()),
  sql: () =>
    import("@codemirror/lang-sql").then((m) => m.sql({ dialect: m.SQLite })),
  r: () => import("codemirror-lang-r").then((m) => m.r()),
};

async function loadLanguage(lang: RuntimeLanguage): Promise<LanguageSupport> {
  return languageLoaders[lang]();
}

// ── Workspace theme (always dark, VS Code-like) ──────────────

const niotebookWorkspaceTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--color-workspace-editor, #0A0A0A)",
      color: "var(--color-workspace-text, #FAFAFA)",
      height: "100%",
    },
    ".cm-scroller": {
      backgroundColor: "var(--color-workspace-editor, #0A0A0A)",
      height: "100%",
      minHeight: "100%",
    },
    ".cm-content": {
      caretColor: "var(--color-workspace-text, #FAFAFA)",
      fontFamily: "var(--font-mono, ui-monospace, monospace)",
      fontSize: "12px",
      lineHeight: "1.6",
      minHeight: "100%",
    },
    ".cm-cursor": {
      borderLeftColor: "var(--color-workspace-text, #FAFAFA)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--color-workspace-editor, #0A0A0A)",
      color: "var(--color-workspace-text-muted, #A3A3A3)",
      border: "none",
      minHeight: "100%",
    },
    ".cm-activeLineGutter": {
      backgroundColor:
        "var(--color-workspace-accent-muted, rgba(0, 255, 102, 0.15))",
    },
    ".cm-activeLine": {
      backgroundColor:
        "var(--color-workspace-accent-muted, rgba(0, 255, 102, 0.15))",
    },
    ".cm-selectionBackground": {
      backgroundColor: "rgba(0, 255, 102, 0.15) !important",
    },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(0, 255, 102, 0.25) !important",
    },
  },
  { dark: true },
);

// ── Extension bundles ─────────────────────────────────────────

/**
 * Base extensions shared across all languages and themes.
 *
 * @param completionOverrides - Optional custom CompletionSource array.
 *   When provided, autocompletion uses these sources instead of the default.
 */
function baseExtensions(
  completionOverrides?: CompletionSource[],
): import("@codemirror/state").Extension[] {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    completionOverrides
      ? autocompletion({ override: completionOverrides })
      : autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap,
      indentWithTab,
    ]),
  ];
}

/**
 * Returns the workspace theme extension.
 * Always uses a dark, VS Code-like workspace palette.
 */
function themeExtension(): import("@codemirror/state").Extension {
  return [
    oneDark,
    niotebookWorkspaceTheme,
    syntaxHighlighting(defaultHighlightStyle),
  ];
}

export { baseExtensions, loadLanguage, themeExtension };
