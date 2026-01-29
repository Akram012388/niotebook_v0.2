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
  syntaxHighlighting,
} from "@codemirror/language";
import { searchKeymap } from "@codemirror/search";
import { tags } from "@lezer/highlight";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  rectangularSelection,
} from "@codemirror/view";
import type { Extension } from "@codemirror/state";
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

/* ------------------------------------------------------------------ */
/*  Theme                                                              */
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
      { backgroundColor: "#cbd5e133" },
    ".cm-activeLine": { backgroundColor: "#f1f5f908" },
    ".cm-activeLineGutter": { backgroundColor: "#f1f5f908" },
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
      { backgroundColor: "#334155" },
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
  },
  { dark: true },
);

const niotebookDarkHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#c792ea" },
  { tag: tags.operator, color: "#89ddff" },
  { tag: tags.string, color: "#c3e88d" },
  { tag: tags.number, color: "#f78c6c" },
  { tag: tags.bool, color: "#ff5370" },
  { tag: tags.comment, color: "#546e7a", fontStyle: "italic" },
  { tag: tags.variableName, color: "#eeffff" },
  { tag: tags.function(tags.variableName), color: "#82aaff" },
  { tag: tags.definition(tags.variableName), color: "#82aaff" },
  { tag: tags.typeName, color: "#ffcb6b" },
  { tag: tags.className, color: "#ffcb6b" },
  { tag: tags.propertyName, color: "#f07178" },
  { tag: tags.tagName, color: "#f07178" },
  { tag: tags.attributeName, color: "#c792ea" },
  { tag: tags.punctuation, color: "#89ddff" },
  { tag: tags.meta, color: "#546e7a" },
]);

export function themeExtension(dark: boolean): Extension {
  return dark
    ? [niotebookDarkTheme, syntaxHighlighting(niotebookDarkHighlight), syntaxHighlighting(defaultHighlightStyle, { fallback: true })]
    : [niotebookLightTheme, syntaxHighlighting(defaultHighlightStyle, { fallback: true })];
}

/* ------------------------------------------------------------------ */
/*  Base extensions                                                    */
/* ------------------------------------------------------------------ */

export function baseExtensions(): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    history(),
    foldGutter(),
    drawSelection(),
    rectangularSelection(),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      indentWithTab,
    ]),
    EditorView.lineWrapping,
  ];
}
