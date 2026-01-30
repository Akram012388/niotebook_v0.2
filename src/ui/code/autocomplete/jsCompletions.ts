/**
 * JavaScript / DOM builtin completions for CodeMirror 6.
 */
import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";

const JS_BUILTINS: Completion[] = [
  // Console
  { label: "console.log", type: "function", detail: "Console" },
  { label: "console.error", type: "function", detail: "Console" },
  { label: "console.warn", type: "function", detail: "Console" },
  { label: "console.info", type: "function", detail: "Console" },
  { label: "console.table", type: "function", detail: "Console" },
  // Global functions
  { label: "parseInt", type: "function", detail: "global" },
  { label: "parseFloat", type: "function", detail: "global" },
  { label: "isNaN", type: "function", detail: "global" },
  { label: "isFinite", type: "function", detail: "global" },
  { label: "setTimeout", type: "function", detail: "global" },
  { label: "setInterval", type: "function", detail: "global" },
  { label: "clearTimeout", type: "function", detail: "global" },
  { label: "clearInterval", type: "function", detail: "global" },
  { label: "fetch", type: "function", detail: "global", info: "fetch(url, options?)" },
  { label: "alert", type: "function", detail: "global" },
  { label: "prompt", type: "function", detail: "global" },
  { label: "confirm", type: "function", detail: "global" },
  // JSON
  { label: "JSON.parse", type: "function", detail: "JSON" },
  { label: "JSON.stringify", type: "function", detail: "JSON" },
  // Math
  { label: "Math.floor", type: "function", detail: "Math" },
  { label: "Math.ceil", type: "function", detail: "Math" },
  { label: "Math.round", type: "function", detail: "Math" },
  { label: "Math.random", type: "function", detail: "Math" },
  { label: "Math.max", type: "function", detail: "Math" },
  { label: "Math.min", type: "function", detail: "Math" },
  { label: "Math.abs", type: "function", detail: "Math" },
  { label: "Math.sqrt", type: "function", detail: "Math" },
  { label: "Math.pow", type: "function", detail: "Math" },
  { label: "Math.PI", type: "constant", detail: "Math" },
  // Object
  { label: "Object.keys", type: "function", detail: "Object" },
  { label: "Object.values", type: "function", detail: "Object" },
  { label: "Object.entries", type: "function", detail: "Object" },
  { label: "Object.assign", type: "function", detail: "Object" },
  { label: "Object.freeze", type: "function", detail: "Object" },
  // Array
  { label: "Array.isArray", type: "function", detail: "Array" },
  { label: "Array.from", type: "function", detail: "Array" },
  // Promise
  { label: "Promise.all", type: "function", detail: "Promise" },
  { label: "Promise.resolve", type: "function", detail: "Promise" },
  { label: "Promise.reject", type: "function", detail: "Promise" },
  // DOM
  { label: "document.getElementById", type: "function", detail: "DOM" },
  { label: "document.querySelector", type: "function", detail: "DOM" },
  { label: "document.querySelectorAll", type: "function", detail: "DOM" },
  { label: "document.createElement", type: "function", detail: "DOM" },
  { label: "document.addEventListener", type: "function", detail: "DOM" },
  // Keywords
  { label: "const", type: "keyword" },
  { label: "let", type: "keyword" },
  { label: "var", type: "keyword" },
  { label: "function", type: "keyword" },
  { label: "return", type: "keyword" },
  { label: "if", type: "keyword" },
  { label: "else", type: "keyword" },
  { label: "for", type: "keyword" },
  { label: "while", type: "keyword" },
  { label: "do", type: "keyword" },
  { label: "switch", type: "keyword" },
  { label: "case", type: "keyword" },
  { label: "break", type: "keyword" },
  { label: "continue", type: "keyword" },
  { label: "try", type: "keyword" },
  { label: "catch", type: "keyword" },
  { label: "finally", type: "keyword" },
  { label: "throw", type: "keyword" },
  { label: "new", type: "keyword" },
  { label: "class", type: "keyword" },
  { label: "extends", type: "keyword" },
  { label: "import", type: "keyword" },
  { label: "export", type: "keyword" },
  { label: "default", type: "keyword" },
  { label: "async", type: "keyword" },
  { label: "await", type: "keyword" },
  { label: "typeof", type: "keyword" },
  { label: "instanceof", type: "keyword" },
  { label: "this", type: "keyword" },
  { label: "null", type: "constant" },
  { label: "undefined", type: "constant" },
  { label: "true", type: "constant" },
  { label: "false", type: "constant" },
];

function jsCompletions(context: CompletionContext): CompletionResult | null {
  // Match word or dotted path (e.g. "console.l", "Math.f")
  const word = context.matchBefore(/[\w.]+/);
  if (!word || word.from === word.to) return null;

  return { from: word.from, options: JS_BUILTINS };
}

export { jsCompletions };
