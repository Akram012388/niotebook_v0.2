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
};

async function loadLanguage(
  lang: RuntimeLanguage,
): Promise<LanguageSupport> {
  return languageLoaders[lang]();
}

// ── Light theme (matches Niotebook surface colors) ────────────

const niotebookLightTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--color-surface, #ffffff)",
      color: "var(--color-foreground, #0f172a)",
    },
    ".cm-content": {
      caretColor: "var(--color-foreground, #0f172a)",
      fontFamily: "var(--font-mono, ui-monospace, monospace)",
      fontSize: "13px",
      lineHeight: "1.6",
    },
    ".cm-cursor": {
      borderLeftColor: "var(--color-foreground, #0f172a)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--color-surface-muted, #f8fafc)",
      color: "var(--color-text-muted, #94a3b8)",
      border: "none",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "var(--color-surface-muted, #f1f5f9)",
    },
    ".cm-activeLine": {
      backgroundColor: "var(--color-surface-muted, #f8fafc)",
    },
    ".cm-selectionBackground": {
      backgroundColor: "rgba(59, 130, 246, 0.15) !important",
    },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(59, 130, 246, 0.2) !important",
    },
  },
  { dark: false },
);

// ── Extension bundles ─────────────────────────────────────────

/** Base extensions shared across all languages and themes. */
function baseExtensions(): import("@codemirror/state").Extension[] {
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
    autocompletion(),
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
 * Returns the theme extension for dark or light mode.
 * Dark = oneDark, Light = niotebookLightTheme + defaultHighlightStyle.
 */
function themeExtension(dark: boolean): import("@codemirror/state").Extension {
  if (dark) return oneDark;
  return [niotebookLightTheme, syntaxHighlighting(defaultHighlightStyle)];
}

export { baseExtensions, loadLanguage, themeExtension };
