import type {
  RuntimeExecutor,
  RuntimeRunInput,
  RuntimeRunResult,
} from "./types";

type SqlJsStatic = {
  Database: new (data?: ArrayLike<number>) => SqlJsDatabase;
};

type SqlJsDatabase = {
  run: (sql: string) => void;
  exec: (sql: string) => SqlJsResult[];
  getRowsModified: () => number;
  close: () => void;
};

type SqlJsResult = {
  columns: string[];
  values: (string | number | null | Uint8Array)[][];
};

type InitSqlJs = (config?: {
  locateFile?: (file: string) => string;
}) => Promise<SqlJsStatic>;

const SQL_JS_CDN = "https://sql.js.org/dist";

let sqlJsPromise: Promise<SqlJsStatic> | null = null;
let db: SqlJsDatabase | null = null;
let seeded = false;
let currentLessonId: string | null = null;

function loadSqlJs(): Promise<SqlJsStatic> {
  if (sqlJsPromise) return sqlJsPromise;

  sqlJsPromise = new Promise<SqlJsStatic>((resolve, reject) => {
    const existing = (globalThis as { initSqlJs?: InitSqlJs }).initSqlJs;
    if (existing) {
      void existing({ locateFile: (file: string) => `${SQL_JS_CDN}/${file}` })
        .then(resolve)
        .catch(reject);
      return;
    }

    const script = document.createElement("script");
    script.src = `${SQL_JS_CDN}/sql-wasm.js`;
    script.onload = () => {
      const init = (globalThis as { initSqlJs?: InitSqlJs }).initSqlJs;
      if (!init) {
        reject(new Error("sql.js failed to load"));
        return;
      }
      void init({ locateFile: (file: string) => `${SQL_JS_CDN}/${file}` })
        .then(resolve)
        .catch(reject);
    };
    script.onerror = () => reject(new Error("Failed to load sql.js script"));
    document.head.appendChild(script);
  });

  return sqlJsPromise;
}

/**
 * Split SQL into individual statements, respecting string literals.
 */
function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]!;

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
    }

    if (ch === ";" && !inSingle && !inDouble) {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = "";
    } else {
      current += ch;
    }
  }

  const trimmed = current.trim();
  if (trimmed) statements.push(trimmed);

  return statements;
}

/**
 * Format a SQL result set as an ASCII table.
 */
function formatAsciiTable(result: SqlJsResult): string {
  const { columns, values } = result;

  // Compute column widths
  const widths = columns.map((col) => col.length);
  for (const row of values) {
    for (let i = 0; i < row.length; i++) {
      const cell = row[i];
      const len = cell === null ? 4 : String(cell).length;
      widths[i] = Math.max(widths[i] ?? 0, len);
    }
  }

  const separator = "+" + widths.map((w) => "-".repeat(w + 2)).join("+") + "+";
  const header =
    "|" +
    columns.map((col, i) => ` ${col.padEnd(widths[i]!)} `).join("|") +
    "|";

  const rows = values.map(
    (row) =>
      "|" +
      row
        .map((cell, i) => {
          const str = cell === null ? "NULL" : String(cell);
          if (typeof cell === "number") {
            return ` ${str.padStart(widths[i]!)} `;
          }
          return ` ${str.padEnd(widths[i]!)} `;
        })
        .join("|") +
      "|",
  );

  const lines = [separator, header, separator, ...rows, separator];
  const rowCount = values.length;
  lines.push(`${String(rowCount)} row${rowCount !== 1 ? "s" : ""}`);

  return lines.join("\n") + "\n";
}

/**
 * Strip SQL comments (-- line comments and /* block comments *​/) to find the
 * first real token. This ensures statements like `-- note\nSELECT ...` are
 * correctly classified as SELECT queries.
 */
function stripLeadingComments(sql: string): string {
  let s = sql;
  for (;;) {
    s = s.trimStart();
    if (s.startsWith("--")) {
      const nl = s.indexOf("\n");
      s = nl === -1 ? "" : s.slice(nl + 1);
    } else if (s.startsWith("/*")) {
      const end = s.indexOf("*/");
      s = end === -1 ? "" : s.slice(end + 2);
    } else {
      break;
    }
  }
  return s;
}

function isSelectStatement(sql: string): boolean {
  const upper = stripLeadingComments(sql).toUpperCase();
  return (
    upper.startsWith("SELECT") ||
    upper.startsWith("PRAGMA") ||
    upper.startsWith("EXPLAIN") ||
    upper.startsWith("WITH")
  );
}

async function initSqlExecutor(): Promise<RuntimeExecutor> {
  const executor: RuntimeExecutor = {
    async init() {
      const SQL = await loadSqlJs();
      if (!db) {
        db = new SQL.Database();
      }
    },

    async run(input: RuntimeRunInput): Promise<RuntimeRunResult> {
      const start = performance.now();
      let stdout = "";
      let stderr = "";

      try {
        // Reset per-lesson state when the lesson changes
        if (
          input.lessonId !== undefined &&
          input.lessonId !== currentLessonId
        ) {
          db?.close();
          db = null;
          seeded = false;
          currentLessonId = input.lessonId;
        }

        if (!db) {
          const SQL = await loadSqlJs();
          db = new SQL.Database();
        }

        // Auto-execute seed files from VFS on first run only
        if (input.filesystem && !seeded) {
          seeded = true;
          for (const seedName of ["schema.sql", "seed.sql"]) {
            const seedContent = input.filesystem.readFile(
              `/project/${seedName}`,
            );
            if (seedContent && seedContent !== input.code) {
              try {
                db.run(seedContent);
              } catch (seedErr) {
                const msg =
                  seedErr instanceof Error ? seedErr.message : String(seedErr);
                stderr += `[${seedName}] ${msg}\n`;
                input.onStderr?.(`[${seedName}] ${msg}\n`);
              }
            }
          }
        }

        const statements = splitStatements(input.code);

        for (const stmt of statements) {
          try {
            if (isSelectStatement(stmt)) {
              const results = db.exec(stmt);
              for (const result of results) {
                const table = formatAsciiTable(result);
                stdout += table;
                input.onStdout?.(table);
              }
            } else {
              db.run(stmt);
              const modified = db.getRowsModified();
              if (modified > 0) {
                const msg = `${String(modified)} row${modified !== 1 ? "s" : ""} affected\n`;
                stdout += msg;
                input.onStdout?.(msg);
              }
            }
          } catch (stmtErr) {
            const msg =
              stmtErr instanceof Error ? stmtErr.message : String(stmtErr);
            const errLine = `Error: ${msg}\n  → ${stmt}\n`;
            stderr += errLine;
            input.onStderr?.(errLine);
          }
        }

        const runtimeMs = Math.round(performance.now() - start);
        return {
          stdout,
          stderr,
          exitCode: stderr ? 1 : 0,
          runtimeMs,
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        stderr += msg + "\n";
        input.onStderr?.(msg + "\n");
        return {
          stdout,
          stderr,
          exitCode: 1,
          runtimeMs: Math.round(performance.now() - start),
        };
      }
    },

    stop() {
      // No long-running process to abort for synchronous SQL
    },
  };

  return executor;
}

export { initSqlExecutor };
