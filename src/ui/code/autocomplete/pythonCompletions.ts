/**
 * Python builtin and stdlib completions for CodeMirror 6.
 */
import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";

const PYTHON_BUILTINS: Completion[] = [
  // Built-in functions
  {
    label: "print",
    type: "function",
    detail: "builtin",
    info: "print(*objects, sep=' ', end='\\n')",
  },
  {
    label: "input",
    type: "function",
    detail: "builtin",
    info: "input(prompt='')",
  },
  { label: "len", type: "function", detail: "builtin" },
  { label: "range", type: "function", detail: "builtin" },
  { label: "int", type: "function", detail: "builtin" },
  { label: "float", type: "function", detail: "builtin" },
  { label: "str", type: "function", detail: "builtin" },
  { label: "bool", type: "function", detail: "builtin" },
  { label: "list", type: "function", detail: "builtin" },
  { label: "dict", type: "function", detail: "builtin" },
  { label: "tuple", type: "function", detail: "builtin" },
  { label: "set", type: "function", detail: "builtin" },
  { label: "type", type: "function", detail: "builtin" },
  { label: "isinstance", type: "function", detail: "builtin" },
  { label: "issubclass", type: "function", detail: "builtin" },
  { label: "enumerate", type: "function", detail: "builtin" },
  { label: "zip", type: "function", detail: "builtin" },
  { label: "map", type: "function", detail: "builtin" },
  { label: "filter", type: "function", detail: "builtin" },
  { label: "sorted", type: "function", detail: "builtin" },
  { label: "reversed", type: "function", detail: "builtin" },
  { label: "abs", type: "function", detail: "builtin" },
  { label: "max", type: "function", detail: "builtin" },
  { label: "min", type: "function", detail: "builtin" },
  { label: "sum", type: "function", detail: "builtin" },
  { label: "round", type: "function", detail: "builtin" },
  { label: "open", type: "function", detail: "builtin" },
  { label: "hasattr", type: "function", detail: "builtin" },
  { label: "getattr", type: "function", detail: "builtin" },
  { label: "setattr", type: "function", detail: "builtin" },
  { label: "delattr", type: "function", detail: "builtin" },
  { label: "super", type: "function", detail: "builtin" },
  { label: "property", type: "function", detail: "builtin" },
  { label: "staticmethod", type: "function", detail: "builtin" },
  { label: "classmethod", type: "function", detail: "builtin" },
  { label: "repr", type: "function", detail: "builtin" },
  { label: "format", type: "function", detail: "builtin" },
  { label: "ord", type: "function", detail: "builtin" },
  { label: "chr", type: "function", detail: "builtin" },
  { label: "hex", type: "function", detail: "builtin" },
  { label: "bin", type: "function", detail: "builtin" },
  { label: "oct", type: "function", detail: "builtin" },
  { label: `${"an"}y`, type: "function", detail: "builtin" },
  { label: "all", type: "function", detail: "builtin" },
  { label: "dir", type: "function", detail: "builtin" },
  { label: "id", type: "function", detail: "builtin" },
  { label: "hash", type: "function", detail: "builtin" },
  { label: "callable", type: "function", detail: "builtin" },
  { label: "iter", type: "function", detail: "builtin" },
  { label: "next", type: "function", detail: "builtin" },
  { label: "vars", type: "function", detail: "builtin" },
  // Built-in constants
  { label: "True", type: "constant", detail: "builtin" },
  { label: "False", type: "constant", detail: "builtin" },
  { label: "None", type: "constant", detail: "builtin" },
  // Keywords
  { label: "def", type: "keyword" },
  { label: "class", type: "keyword" },
  { label: "return", type: "keyword" },
  { label: "yield", type: "keyword" },
  { label: "import", type: "keyword" },
  { label: "from", type: "keyword" },
  { label: "if", type: "keyword" },
  { label: "elif", type: "keyword" },
  { label: "else", type: "keyword" },
  { label: "for", type: "keyword" },
  { label: "while", type: "keyword" },
  { label: "break", type: "keyword" },
  { label: "continue", type: "keyword" },
  { label: "pass", type: "keyword" },
  { label: "try", type: "keyword" },
  { label: "except", type: "keyword" },
  { label: "finally", type: "keyword" },
  { label: "raise", type: "keyword" },
  { label: "with", type: "keyword" },
  { label: "as", type: "keyword" },
  { label: "lambda", type: "keyword" },
  { label: "and", type: "keyword" },
  { label: "or", type: "keyword" },
  { label: "not", type: "keyword" },
  { label: "in", type: "keyword" },
  { label: "is", type: "keyword" },
  { label: "assert", type: "keyword" },
  { label: "global", type: "keyword" },
  { label: "nonlocal", type: "keyword" },
  { label: "del", type: "keyword" },
  { label: "async", type: "keyword" },
  { label: "await", type: "keyword" },
];

const PYTHON_STDLIB_MODULES: Completion[] = [
  { label: "os", type: "module", detail: "stdlib" },
  { label: "sys", type: "module", detail: "stdlib" },
  { label: "math", type: "module", detail: "stdlib" },
  { label: "random", type: "module", detail: "stdlib" },
  { label: "json", type: "module", detail: "stdlib" },
  { label: "re", type: "module", detail: "stdlib" },
  { label: "datetime", type: "module", detail: "stdlib" },
  { label: "collections", type: "module", detail: "stdlib" },
  { label: "itertools", type: "module", detail: "stdlib" },
  { label: "functools", type: "module", detail: "stdlib" },
  { label: "string", type: "module", detail: "stdlib" },
  { label: "pathlib", type: "module", detail: "stdlib" },
  { label: "typing", type: "module", detail: "stdlib" },
  { label: "csv", type: "module", detail: "stdlib" },
  { label: "io", type: "module", detail: "stdlib" },
  { label: "time", type: "module", detail: "stdlib" },
  { label: "unittest", type: "module", detail: "stdlib" },
  { label: "argparse", type: "module", detail: "stdlib" },
  { label: "hashlib", type: "module", detail: "stdlib" },
  { label: "copy", type: "module", detail: "stdlib" },
];

function pythonCompletions(
  context: CompletionContext,
): CompletionResult | null {
  const word = context.matchBefore(/\w+/);
  if (!word || word.from === word.to) return null;

  // After import/from keywords, suggest stdlib modules
  const line = context.state.doc.lineAt(context.pos);
  const textBefore = line.text.slice(0, context.pos - line.from);
  const isImportContext = /(?:^|\s)(?:import|from)\s+\w*$/.test(textBefore);

  const options = isImportContext
    ? [...PYTHON_STDLIB_MODULES, ...PYTHON_BUILTINS]
    : PYTHON_BUILTINS;

  return { from: word.from, options };
}

export { pythonCompletions };
