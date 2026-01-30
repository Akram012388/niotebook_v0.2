/**
 * C stdlib and CS50 library completions for CodeMirror 6.
 */
import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";

const C_STDLIB: Completion[] = [
  // stdio.h
  { label: "printf", type: "function", detail: "stdio.h", info: "int printf(const char *format, ...)" },
  { label: "scanf", type: "function", detail: "stdio.h", info: "int scanf(const char *format, ...)" },
  { label: "fprintf", type: "function", detail: "stdio.h" },
  { label: "fscanf", type: "function", detail: "stdio.h" },
  { label: "sprintf", type: "function", detail: "stdio.h" },
  { label: "snprintf", type: "function", detail: "stdio.h" },
  { label: "fopen", type: "function", detail: "stdio.h" },
  { label: "fclose", type: "function", detail: "stdio.h" },
  { label: "fread", type: "function", detail: "stdio.h" },
  { label: "fwrite", type: "function", detail: "stdio.h" },
  { label: "fgets", type: "function", detail: "stdio.h" },
  { label: "fputs", type: "function", detail: "stdio.h" },
  { label: "puts", type: "function", detail: "stdio.h" },
  { label: "getchar", type: "function", detail: "stdio.h" },
  { label: "putchar", type: "function", detail: "stdio.h" },
  { label: "EOF", type: "constant", detail: "stdio.h" },
  { label: "NULL", type: "constant", detail: "stddef.h" },
  { label: "FILE", type: "type", detail: "stdio.h" },
  { label: "stdin", type: "variable", detail: "stdio.h" },
  { label: "stdout", type: "variable", detail: "stdio.h" },
  { label: "stderr", type: "variable", detail: "stdio.h" },
  // stdlib.h
  { label: "malloc", type: "function", detail: "stdlib.h" },
  { label: "calloc", type: "function", detail: "stdlib.h" },
  { label: "realloc", type: "function", detail: "stdlib.h" },
  { label: "free", type: "function", detail: "stdlib.h" },
  { label: "exit", type: "function", detail: "stdlib.h" },
  { label: "atoi", type: "function", detail: "stdlib.h" },
  { label: "atof", type: "function", detail: "stdlib.h" },
  { label: "rand", type: "function", detail: "stdlib.h" },
  { label: "srand", type: "function", detail: "stdlib.h" },
  { label: "abs", type: "function", detail: "stdlib.h" },
  { label: "EXIT_SUCCESS", type: "constant", detail: "stdlib.h" },
  { label: "EXIT_FAILURE", type: "constant", detail: "stdlib.h" },
  // string.h
  { label: "strlen", type: "function", detail: "string.h" },
  { label: "strcpy", type: "function", detail: "string.h" },
  { label: "strncpy", type: "function", detail: "string.h" },
  { label: "strcat", type: "function", detail: "string.h" },
  { label: "strcmp", type: "function", detail: "string.h" },
  { label: "strncmp", type: "function", detail: "string.h" },
  { label: "strchr", type: "function", detail: "string.h" },
  { label: "strstr", type: "function", detail: "string.h" },
  { label: "memcpy", type: "function", detail: "string.h" },
  { label: "memset", type: "function", detail: "string.h" },
  // math.h
  { label: "sqrt", type: "function", detail: "math.h" },
  { label: "pow", type: "function", detail: "math.h" },
  { label: "floor", type: "function", detail: "math.h" },
  { label: "ceil", type: "function", detail: "math.h" },
  { label: "round", type: "function", detail: "math.h" },
  { label: "log", type: "function", detail: "math.h" },
  { label: "sin", type: "function", detail: "math.h" },
  { label: "cos", type: "function", detail: "math.h" },
  { label: "tan", type: "function", detail: "math.h" },
  // ctype.h
  { label: "isalpha", type: "function", detail: "ctype.h" },
  { label: "isdigit", type: "function", detail: "ctype.h" },
  { label: "isalnum", type: "function", detail: "ctype.h" },
  { label: "islower", type: "function", detail: "ctype.h" },
  { label: "isupper", type: "function", detail: "ctype.h" },
  { label: "toupper", type: "function", detail: "ctype.h" },
  { label: "tolower", type: "function", detail: "ctype.h" },
  // Types
  { label: "int", type: "type", detail: "keyword" },
  { label: "char", type: "type", detail: "keyword" },
  { label: "float", type: "type", detail: "keyword" },
  { label: "double", type: "type", detail: "keyword" },
  { label: "void", type: "type", detail: "keyword" },
  { label: "long", type: "type", detail: "keyword" },
  { label: "short", type: "type", detail: "keyword" },
  { label: "unsigned", type: "type", detail: "keyword" },
  { label: "signed", type: "type", detail: "keyword" },
  { label: "size_t", type: "type", detail: "stddef.h" },
  { label: "bool", type: "type", detail: "stdbool.h" },
  { label: "true", type: "constant", detail: "stdbool.h" },
  { label: "false", type: "constant", detail: "stdbool.h" },
  // Keywords
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
  { label: "default", type: "keyword" },
  { label: "struct", type: "keyword" },
  { label: "typedef", type: "keyword" },
  { label: "enum", type: "keyword" },
  { label: "const", type: "keyword" },
  { label: "sizeof", type: "keyword" },
];

/** CS50 library completions (common in intro CS courses). */
const CS50_LIBRARY: Completion[] = [
  { label: "get_string", type: "function", detail: "cs50.h", info: "string get_string(const char *prompt, ...)" },
  { label: "get_int", type: "function", detail: "cs50.h", info: "int get_int(const char *prompt, ...)" },
  { label: "get_float", type: "function", detail: "cs50.h", info: "float get_float(const char *prompt, ...)" },
  { label: "get_char", type: "function", detail: "cs50.h", info: "char get_char(const char *prompt, ...)" },
  { label: "get_long", type: "function", detail: "cs50.h", info: "long get_long(const char *prompt, ...)" },
  { label: "string", type: "type", detail: "cs50.h", info: "typedef char *string" },
];

/** Common #include headers. */
const C_HEADERS: Completion[] = [
  { label: "stdio.h", type: "module", detail: "Standard I/O" },
  { label: "stdlib.h", type: "module", detail: "Standard library" },
  { label: "string.h", type: "module", detail: "String operations" },
  { label: "math.h", type: "module", detail: "Math functions" },
  { label: "ctype.h", type: "module", detail: "Character types" },
  { label: "stdbool.h", type: "module", detail: "Boolean type" },
  { label: "stdint.h", type: "module", detail: "Integer types" },
  { label: "assert.h", type: "module", detail: "Assertions" },
  { label: "cs50.h", type: "module", detail: "CS50 library" },
];

function cCompletions(context: CompletionContext): CompletionResult | null {
  // Check if we're in an #include context
  const line = context.state.doc.lineAt(context.pos);
  const textBefore = line.text.slice(0, context.pos - line.from);
  const includeMatch = /#include\s*<([^>]*)$/.exec(textBefore);

  if (includeMatch) {
    const partial = includeMatch[1];
    return {
      from: context.pos - partial.length,
      options: C_HEADERS,
    };
  }

  const word = context.matchBefore(/\w+/);
  if (!word || word.from === word.to) return null;

  return {
    from: word.from,
    options: [...C_STDLIB, ...CS50_LIBRARY],
  };
}

export { cCompletions };
