/**
 * Language-specific code snippets for CodeMirror 6.
 *
 * Uses CM6 `snippet()` for template syntax with tab stops.
 * See: https://codemirror.net/docs/ref/#autocomplete.snippet
 */
import { snippet } from "@codemirror/autocomplete";
import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";

import type { RuntimeLanguage } from "../../../infra/runtime/types";

// ── Python snippets ─────────────────────────────────────────

const PYTHON_SNIPPETS: Completion[] = [
  {
    label: "def",
    type: "keyword",
    detail: "function definition",
    apply: snippet("def ${name}(${params}):\n\t${body}"),
  },
  {
    label: "for",
    type: "keyword",
    detail: "for loop",
    apply: snippet("for ${item} in ${iterable}:\n\t${body}"),
  },
  {
    label: "class",
    type: "keyword",
    detail: "class definition",
    apply: snippet(
      "class ${Name}:\n\tdef __init__(self${, params}):\n\t\t${pass}",
    ),
  },
  {
    label: "if",
    type: "keyword",
    detail: "if statement",
    apply: snippet("if ${condition}:\n\t${body}"),
  },
  {
    label: "ifelse",
    type: "keyword",
    detail: "if/else statement",
    apply: snippet("if ${condition}:\n\t${body}\nelse:\n\t${else_body}"),
  },
  {
    label: "while",
    type: "keyword",
    detail: "while loop",
    apply: snippet("while ${condition}:\n\t${body}"),
  },
  {
    label: "try",
    type: "keyword",
    detail: "try/except block",
    apply: snippet(
      "try:\n\t${body}\nexcept ${Exception} as ${e}:\n\t${handler}",
    ),
  },
  {
    label: "with",
    type: "keyword",
    detail: "with statement",
    apply: snippet("with ${expression} as ${name}:\n\t${body}"),
  },
  {
    label: "__main__",
    type: "keyword",
    detail: "main guard",
    apply: snippet('if __name__ == "__main__":\n\t${main()}'),
  },
  {
    label: "lambda",
    type: "keyword",
    detail: "lambda expression",
    apply: snippet("lambda ${params}: ${expression}"),
  },
  {
    label: "listcomp",
    type: "keyword",
    detail: "list comprehension",
    apply: snippet("[${expr} for ${item} in ${iterable}]"),
  },
];

// ── C snippets ──────────────────────────────────────────────

const C_SNIPPETS: Completion[] = [
  {
    label: "main",
    type: "keyword",
    detail: "main function",
    apply: snippet("int main(void)\n{\n\t${}\n\treturn 0;\n}"),
  },
  {
    label: "mainargs",
    type: "keyword",
    detail: "main with args",
    apply: snippet(
      "int main(int argc, char *argv[])\n{\n\t${}\n\treturn 0;\n}",
    ),
  },
  {
    label: "for",
    type: "keyword",
    detail: "for loop",
    apply: snippet("for (int ${i} = 0; ${i} < ${n}; ${i}++)\n{\n\t${}\n}"),
  },
  {
    label: "while",
    type: "keyword",
    detail: "while loop",
    apply: snippet("while (${condition})\n{\n\t${}\n}"),
  },
  {
    label: "if",
    type: "keyword",
    detail: "if statement",
    apply: snippet("if (${condition})\n{\n\t${}\n}"),
  },
  {
    label: "ifelse",
    type: "keyword",
    detail: "if/else statement",
    apply: snippet("if (${condition})\n{\n\t${}\n}\nelse\n{\n\t${}\n}"),
  },
  {
    label: "printf",
    type: "function",
    detail: "printf call",
    apply: snippet('printf("${format}\\n"${, args});'),
  },
  {
    label: "scanf",
    type: "function",
    detail: "scanf call",
    apply: snippet('scanf("${format}", ${&var});'),
  },
  {
    label: "#include",
    type: "keyword",
    detail: "include header",
    apply: snippet("#include <${header}.h>"),
  },
  {
    label: "struct",
    type: "keyword",
    detail: "struct definition",
    apply: snippet("typedef struct\n{\n\t${members}\n}\n${Name};"),
  },
  {
    label: "func",
    type: "keyword",
    detail: "function definition",
    apply: snippet("${void} ${name}(${params})\n{\n\t${}\n}"),
  },
  {
    label: "switch",
    type: "keyword",
    detail: "switch statement",
    apply: snippet(
      "switch (${expression})\n{\n\tcase ${value}:\n\t\t${}\n\t\tbreak;\n\tdefault:\n\t\t${}\n}",
    ),
  },
];

// ── JavaScript snippets ─────────────────────────────────────

const JS_SNIPPETS: Completion[] = [
  {
    label: "arrow",
    type: "keyword",
    detail: "arrow function",
    apply: snippet("const ${name} = (${params}) => {\n\t${}\n};"),
  },
  {
    label: "function",
    type: "keyword",
    detail: "function declaration",
    apply: snippet("function ${name}(${params}) {\n\t${}\n}"),
  },
  {
    label: "for",
    type: "keyword",
    detail: "for loop",
    apply: snippet("for (let ${i} = 0; ${i} < ${length}; ${i}++) {\n\t${}\n}"),
  },
  {
    label: "forof",
    type: "keyword",
    detail: "for...of loop",
    apply: snippet("for (const ${item} of ${iterable}) {\n\t${}\n}"),
  },
  {
    label: "forin",
    type: "keyword",
    detail: "for...in loop",
    apply: snippet("for (const ${key} in ${object}) {\n\t${}\n}"),
  },
  {
    label: "if",
    type: "keyword",
    detail: "if statement",
    apply: snippet("if (${condition}) {\n\t${}\n}"),
  },
  {
    label: "ifelse",
    type: "keyword",
    detail: "if/else statement",
    apply: snippet("if (${condition}) {\n\t${}\n} else {\n\t${}\n}"),
  },
  {
    label: "clog",
    type: "function",
    detail: "console.log",
    apply: snippet("console.log(${});"),
  },
  {
    label: "cerr",
    type: "function",
    detail: "console.error",
    apply: snippet("console.error(${});"),
  },
  {
    label: "fetch",
    type: "function",
    detail: "fetch request",
    apply: snippet(
      'const ${response} = await fetch("${url}");\nconst ${data} = await ${response}.json();',
    ),
  },
  {
    label: "try",
    type: "keyword",
    detail: "try/catch block",
    apply: snippet(
      "try {\n\t${}\n} catch (${error}) {\n\t${console.error(error);}\n}",
    ),
  },
  {
    label: "class",
    type: "keyword",
    detail: "class declaration",
    apply: snippet(
      "class ${Name} {\n\tconstructor(${params}) {\n\t\t${}\n\t}\n}",
    ),
  },
  {
    label: "async",
    type: "keyword",
    detail: "async function",
    apply: snippet("async function ${name}(${params}) {\n\t${}\n}"),
  },
  {
    label: "map",
    type: "function",
    detail: ".map() callback",
    apply: snippet("${array}.map((${item}) => {\n\t${}\n})"),
  },
  {
    label: "filter",
    type: "function",
    detail: ".filter() callback",
    apply: snippet("${array}.filter((${item}) => ${condition})"),
  },
  {
    label: "ternary",
    type: "keyword",
    detail: "ternary expression",
    apply: snippet("${condition} ? ${trueVal} : ${falseVal}"),
  },
];

// ── Snippet lookup ──────────────────────────────────────────

const SNIPPETS_BY_LANGUAGE: Record<RuntimeLanguage, Completion[]> = {
  python: PYTHON_SNIPPETS,
  c: C_SNIPPETS,
  js: JS_SNIPPETS,
  html: [], // HTML snippets could be added later
  css: [],
  sql: [],
  r: [],
};

function createSnippetCompletionSource(language: RuntimeLanguage) {
  const snippets = SNIPPETS_BY_LANGUAGE[language];

  return (context: CompletionContext): CompletionResult | null => {
    if (snippets.length === 0) return null;

    const word = context.matchBefore(/[\w#]+/);
    if (!word || word.from === word.to) return null;

    return {
      from: word.from,
      options: snippets.map((s) => ({ ...s, boost: -1 })), // lower priority than builtins
    };
  };
}

export { createSnippetCompletionSource, SNIPPETS_BY_LANGUAGE };
