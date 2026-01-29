/**
 * CodeMirror 6 configuration for the Niotebook code editor.
 *
 * Provides base extensions, per-language support (syntax + tab size),
 * and custom light/dark themes with comprehensive syntax highlighting.
 */

import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import {
  HighlightStyle,
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorState, type Extension } from "@codemirror/state";
import { tags } from "@lezer/highlight";
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
  placeholder,
  rectangularSelection,
  scrollPastEnd,
} from "@codemirror/view";
import type { RuntimeLanguage } from "../../infra/runtime/types";

/* ------------------------------------------------------------------ */
/*  Language support                                                   */
/* ------------------------------------------------------------------ */

export function languageExtension(lang: RuntimeLanguage): Extension {
  switch (lang) {
    case "js":
      return javascript();
    case "python":
      return python();
    case "html":
      return html();
    case "c":
      return cpp();
  }
}

/** Per-language tab size: 4 for Python/C, 2 for JS/HTML. */
export function tabSizeExtension(lang: RuntimeLanguage): Extension {
  const size = lang === "python" || lang === "c" ? 4 : 2;
  return [
    EditorState.tabSize.of(size),
    indentUnit.of(" ".repeat(size)),
  ];
}

/* ------------------------------------------------------------------ */
/*  Themes                                                             */
/* ------------------------------------------------------------------ */

const niotebookLightTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#ffffff",
      color: "#0f172a",
    },
    ".cm-content": {
      caretColor: "#0f172a",
      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
      fontSize: "14px",
      lineHeight: "1.6",
      padding: "8px 0",
    },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#0f172a" },
    ".cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground":
      { backgroundColor: "#3b82f622" },
    ".cm-activeLine": { backgroundColor: "#f1f5f920" },
    ".cm-activeLineGutter": { backgroundColor: "#f1f5f920" },
    ".cm-gutters": {
      backgroundColor: "#f8fafc",
      color: "#94a3b8",
      border: "none",
      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
      fontSize: "12px",
    },
    ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px 0 12px" },
    ".cm-foldGutter .cm-gutterElement": { padding: "0 4px" },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": { overflow: "auto" },
    ".cm-foldPlaceholder": {
      backgroundColor: "#f1f5f9",
      border: "none",
      color: "#64748b",
    },
  },
  { dark: false },
);

const niotebookDarkTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#0f172a",
      color: "#e2e8f0",
    },
    ".cm-content": {
      caretColor: "#e2e8f0",
      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
      fontSize: "14px",
      lineHeight: "1.6",
      padding: "8px 0",
    },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#e2e8f0" },
    ".cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground":
      { backgroundColor: "#3b82f633" },
    ".cm-activeLine": { backgroundColor: "#1e293b40" },
    ".cm-activeLineGutter": { backgroundColor: "#1e293b40" },
    ".cm-gutters": {
      backgroundColor: "#0f172a",
      color: "#475569",
      border: "none",
      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
      fontSize: "12px",
    },
    ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px 0 12px" },
    ".cm-foldGutter .cm-gutterElement": { padding: "0 4px" },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": { overflow: "auto" },
    ".cm-foldPlaceholder": {
      backgroundColor: "#1e293b",
      border: "none",
      color: "#94a3b8",
    },
  },
  { dark: true },
);

/* ------------------------------------------------------------------ */
/*  Syntax highlighting                                                */
/* ------------------------------------------------------------------ */

const niotebookDarkHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#c792ea" },
  { tag: tags.operator, color: "#89ddff" },
  { tag: tags.operatorKeyword, color: "#89ddff" },
  { tag: tags.string, color: "#c3e88d" },
  { tag: tags.regexp, color: "#f78c6c" },
  { tag: tags.number, color: "#f78c6c" },
  { tag: tags.bool, color: "#ff5370" },
  { tag: tags.null, color: "#ff5370" },
  { tag: tags.comment, color: "#546e7a", fontStyle: "italic" },
  { tag: tags.lineComment, color: "#546e7a", fontStyle: "italic" },
  { tag: tags.blockComment, color: "#546e7a", fontStyle: "italic" },
  { tag: tags.variableName, color: "#eeffff" },
  { tag: tags.function(tags.variableName), color: "#82aaff" },
  { tag: tags.definition(tags.variableName), color: "#82aaff" },
  { tag: tags.definition(tags.propertyName), color: "#f07178" },
  { tag: tags.typeName, color: "#ffcb6b" },
  { tag: tags.className, color: "#ffcb6b" },
  { tag: tags.propertyName, color: "#f07178" },
  { tag: tags.tagName, color: "#f07178" },
  { tag: tags.attributeName, color: "#c792ea" },
  { tag: tags.attributeValue, color: "#c3e88d" },
  { tag: tags.punctuation, color: "#89ddff" },
  { tag: tags.paren, color: "#89ddff" },
  { tag: tags.brace, color: "#89ddff" },
  { tag: tags.bracket, color: "#89ddff" },
  { tag: tags.meta, color: "#546e7a" },
  { tag: tags.heading, color: "#82aaff", fontWeight: "bold" },
  { tag: tags.link, color: "#c3e88d", textDecoration: "underline" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "bold" },
  { tag: tags.processingInstruction, color: "#ffcb6b" },
  { tag: tags.labelName, color: "#f07178" },
  { tag: tags.self, color: "#f07178", fontStyle: "italic" },
]);

const niotebookLightHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#7c3aed" },
  { tag: tags.operator, color: "#0891b2" },
  { tag: tags.operatorKeyword, color: "#0891b2" },
  { tag: tags.string, color: "#059669" },
  { tag: tags.regexp, color: "#ea580c" },
  { tag: tags.number, color: "#ea580c" },
  { tag: tags.bool, color: "#dc2626" },
  { tag: tags.null, color: "#dc2626" },
  { tag: tags.comment, color: "#94a3b8", fontStyle: "italic" },
  { tag: tags.lineComment, color: "#94a3b8", fontStyle: "italic" },
  { tag: tags.blockComment, color: "#94a3b8", fontStyle: "italic" },
  { tag: tags.variableName, color: "#0f172a" },
  { tag: tags.function(tags.variableName), color: "#2563eb" },
  { tag: tags.definition(tags.variableName), color: "#2563eb" },
  { tag: tags.definition(tags.propertyName), color: "#dc2626" },
  { tag: tags.typeName, color: "#d97706" },
  { tag: tags.className, color: "#d97706" },
  { tag: tags.propertyName, color: "#dc2626" },
  { tag: tags.tagName, color: "#dc2626" },
  { tag: tags.attributeName, color: "#7c3aed" },
  { tag: tags.attributeValue, color: "#059669" },
  { tag: tags.punctuation, color: "#64748b" },
  { tag: tags.paren, color: "#64748b" },
  { tag: tags.brace, color: "#64748b" },
  { tag: tags.bracket, color: "#64748b" },
  { tag: tags.meta, color: "#94a3b8" },
  { tag: tags.heading, color: "#2563eb", fontWeight: "bold" },
  { tag: tags.link, color: "#059669", textDecoration: "underline" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "bold" },
  { tag: tags.processingInstruction, color: "#d97706" },
  { tag: tags.labelName, color: "#dc2626" },
  { tag: tags.self, color: "#dc2626", fontStyle: "italic" },
]);

export function themeExtension(dark: boolean): Extension {
  return dark
    ? [niotebookDarkTheme, syntaxHighlighting(niotebookDarkHighlight), syntaxHighlighting(defaultHighlightStyle, { fallback: true })]
    : [niotebookLightTheme, syntaxHighlighting(niotebookLightHighlight), syntaxHighlighting(defaultHighlightStyle, { fallback: true })];
}

/* ------------------------------------------------------------------ */
/*  Base extensions                                                    */
/* ------------------------------------------------------------------ */

/**
 * Core editor extensions shared across all languages and themes.
 *
 * Mirrors most of CodeMirror's `basicSetup` but gives us explicit
 * control over each feature. Language, theme, and tab-size are NOT
 * included — those are managed via compartments in CodeMirrorEditor
 * so they can be swapped at runtime without recreating the view.
 */
export function baseExtensions(): Extension[] {
  return [
    // Appearance
    highlightSpecialChars(),
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    crosshairCursor(),
    rectangularSelection(),
    highlightSelectionMatches(),
    scrollPastEnd(),
    placeholder("Write your code here..."),

    // Multi-cursor
    EditorState.allowMultipleSelections.of(true),

    // Editing
    history(),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),

    // Keymaps (order matters — later bindings take priority)
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
