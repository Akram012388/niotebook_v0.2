# Editor Support: SQL & R Language Integration

> Implementation plan for adding dedicated SQL and R language execution to the Niotebook code editor runtime.

---

## Context

CS50 SQL and CS50R courses have been added to the course catalog for the alpha version. The editor currently supports JavaScript, Python, C, HTML, and CSS. SQL has a partial preset (`cs50sql-sql`) that routes through Python's cs50 library, but there is no native SQL executor. R has no support at all.

This plan adds first-class SQL and R support across the full stack: runtime execution, syntax highlighting, terminal commands, VFS file handling, and environment presets.

---

## Architecture Decisions

| Decision              | Choice                                   | Rationale                                                         |
| --------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| SQL execution engine  | `sql.js` (SQLite compiled to WASM)       | Dedicated executor with real query results, ~1MB, well-maintained |
| R execution engine    | `webR` (R compiled to WASM)              | Only viable browser-based R runtime, maintained by R Project      |
| webR loading strategy | Lazy-load on first R use                 | ~30MB download, don't penalize non-R students                     |
| SQL result display    | Formatted ASCII table in terminal        | Consistent with existing terminal UX, matches sqlite3 CLI         |
| R plot rendering      | SVG output in existing HTML preview pane | Zero new UI components, reuses iframe infrastructure              |
| R package scope       | Core R only (no tidyverse)               | Sufficient for CS50R fundamentals, minimizes bundle               |
| Multi-statement SQL   | Yes, sequential execution                | CS50 SQL exercises require multi-query files                      |
| Terminal commands     | `sqlite3` and `Rscript`                  | Matches existing pattern for `python3`/`gcc`                      |
| cs50sql-sql preset    | Replace with native SQL executor         | Clean break, no legacy Python-based path                          |
| SQL autocomplete      | Skip for alpha                           | Reduces scope; can add schema-aware completions later             |

---

## Implementation Steps

### Step 1: Extend `RuntimeLanguage` Type

**File:** `src/infra/runtime/types.ts`

Add `"sql"` and `"r"` to the `RuntimeLanguage` union type:

```typescript
type RuntimeLanguage = "js" | "python" | "html" | "c" | "css" | "sql" | "r";
```

This is the foundational change — every downstream integration keys off this type.

---

### Step 2: SQL Executor

**New file:** `src/infra/runtime/sqlExecutor.ts`

**Dependency:** `sql.js` (SQLite compiled to WASM, ~1MB)

The SQL executor implements the `RuntimeExecutor` interface (`init`, `run`, `stop`):

- **Initialization:** Lazy-load `sql.js`, create an in-memory `SQL.Database` instance, cache it for the session
- **Seed data:** On init, scan VFS for `schema.sql` or `seed.sql` starter files and auto-execute them to set up tables and data
- **Execution flow:**
  1. Split input on `;` (respecting string literals)
  2. Execute each statement sequentially
  3. For `SELECT` queries: format results as an ASCII table with column headers, borders, and aligned data
  4. For `CREATE`/`INSERT`/`UPDATE`/`DELETE`: output affected row count
  5. Surface SQLite errors in stderr with statement context
- **Session persistence:** The `SQL.Database` instance persists across runs within a session, so tables created in one run are available in the next

**ASCII table output format:**

```
+----+----------+-------+
| id | name     | score |
+----+----------+-------+
|  1 | Alice    |    95 |
|  2 | Bob      |    87 |
+----+----------+-------+
2 rows
```

---

### Step 3: R Executor

**New file:** `src/infra/runtime/rExecutor.ts`

**Dependency:** `webr` (R compiled to WASM, ~30MB, loaded from CDN)

The R executor implements `RuntimeExecutor`:

- **Initialization:** Lazy-load webR from CDN on first use. This is a one-time ~30MB download per session. Show a loading indicator during init.
- **VFS mounting:** Write all `.R` files from VFS to webR's Emscripten virtual filesystem before each run
- **Text output:** Capture stdout/stderr via webR's output capture API, stream chunks to terminal via `onStdout`/`onStderr` callbacks
- **Plot output:** Configure webR's graphics device to output SVG. After execution, if SVG data was produced, return it as a special field in `RuntimeRunResult` (or via a side-channel)
- **Timeout:** Default 15 seconds (R startup is slower than other languages)
- **Packages:** Core R standard library only. No tidyverse or additional packages for alpha.

---

### Step 4: CodeMirror Language Modes

**File:** `src/ui/code/codemirrorSetup.ts`

Add to the `languageLoaders` map:

```typescript
sql: () => import("@codemirror/lang-sql").then((m) => m.sql({ dialect: SQLite })),
r: () => import("codemirror-lang-r").then((m) => m.r()),
```

**Dependencies:**

- `@codemirror/lang-sql` — official CodeMirror SQL package with SQLite dialect
- `codemirror-lang-r` — community R language mode (evaluate availability; fallback to `StreamLanguage` with a custom R tokenizer if needed)

---

### Step 5: VFS Extension Mapping

**File:** `src/infra/vfs/VirtualFS.ts`

Add to `EXTENSION_LANGUAGE_MAP`:

```typescript
".sql": "sql",
".r": "r",
".R": "r",
```

This enables automatic language detection when students create or open `.sql` and `.R` files.

---

### Step 6: Runtime Manager Routing

**File:** `src/infra/runtime/runtimeManager.ts`

Add cases to the executor loading switch:

```typescript
case "sql": return import("./sqlExecutor").then((m) => m.createSqlExecutor());
case "r": return import("./rExecutor").then((m) => m.createRExecutor());
```

No sandbox routing needed — both executors run in-process via WASM (sql.js in the main thread, webR in a web worker or service worker depending on its API).

---

### Step 7: Terminal Command Router

**File:** `src/ui/code/terminal/commandRouter.ts`

Add to `LANGUAGE_MAP`:

```typescript
sqlite3: "sql",
Rscript: "r",
```

This allows students to type `sqlite3 queries.sql` or `Rscript hello.R` in the terminal, matching the pattern already established for `python3` and `gcc`.

---

### Step 8: Environment Presets

**File:** `src/infra/runtime/envPresets.ts`

**Replace `cs50sql-sql`** preset:

```typescript
"cs50sql-sql": {
  id: "cs50sql-sql",
  name: "CS50 SQL",
  primaryLanguage: "sql",
  allowedLanguages: ["sql"],
  starterFiles: [
    {
      path: "/project/queries.sql",
      content: "-- Write your SQL queries here\nSELECT 'hello, SQL';\n",
      readonly: false,
    },
  ],
  packages: [],
  runtimeSettings: {
    timeoutMs: 10_000,
    maxOutputBytes: 1_048_576,
    stdinEnabled: false,
  },
}
```

**Add `cs50r` preset:**

```typescript
"cs50r": {
  id: "cs50r",
  name: "CS50R",
  primaryLanguage: "r",
  allowedLanguages: ["r"],
  starterFiles: [
    {
      path: "/project/hello.R",
      content: 'cat("hello, world\\n")\n',
      readonly: false,
    },
  ],
  packages: [],
  runtimeSettings: {
    timeoutMs: 15_000,
    maxOutputBytes: 1_048_576,
    stdinEnabled: false,
  },
}
```

---

### Step 9: Import Resolver

**File:** `src/infra/runtime/imports/importResolver.ts`

Add `.sql` and `.r`/`.R` to the extension candidates array so the resolver can find files without explicit extensions.

---

### Step 10: R Plot Rendering

**File:** `src/ui/panes/CodePane.tsx` (or extracted helper)

After R execution completes, if SVG plot data is present in the result:

1. Wrap the SVG in a minimal HTML document
2. Inject it into the existing HTML preview iframe via `srcdoc`
3. This reuses the exact same rendering path as the HTML executor — no new UI components needed

The terminal shows text output (`print()`, `cat()`, `summary()`), while the HTML pane shows graphical output (`plot()`, `hist()`, `barplot()`).

---

### Step 11: Update Domain Types

**File:** `src/domain/lessonEnvironment.ts`

Add `"cs50r"` to the `EnvPresetId` union type. The existing `"cs50sql-sql"` entry stays but its backing implementation changes from Python-based to native SQL.

---

## Files Modified Summary

| File                                          | Change                                     |
| --------------------------------------------- | ------------------------------------------ |
| `src/infra/runtime/types.ts`                  | Add `"sql"` and `"r"` to `RuntimeLanguage` |
| `src/infra/runtime/sqlExecutor.ts`            | **New** — SQL executor using sql.js        |
| `src/infra/runtime/rExecutor.ts`              | **New** — R executor using webR            |
| `src/infra/vfs/VirtualFS.ts`                  | Add `.sql`, `.r`, `.R` extension mappings  |
| `src/infra/runtime/runtimeManager.ts`         | Add sql/r executor routing                 |
| `src/ui/code/codemirrorSetup.ts`              | Add SQL and R language modes               |
| `src/ui/code/terminal/commandRouter.ts`       | Add `sqlite3`, `Rscript` commands          |
| `src/infra/runtime/envPresets.ts`             | Replace cs50sql-sql, add cs50r preset      |
| `src/infra/runtime/imports/importResolver.ts` | Add `.sql`, `.r` extensions                |
| `src/domain/lessonEnvironment.ts`             | Add `"cs50r"` to `EnvPresetId`             |
| `src/ui/panes/CodePane.tsx`                   | Handle R plot output to HTML pane          |

## New Dependencies

| Package                 | Size              | Purpose                 |
| ----------------------- | ----------------- | ----------------------- |
| `sql.js`                | ~1MB              | SQLite compiled to WASM |
| `webr`                  | ~30MB (CDN, lazy) | R compiled to WASM      |
| `@codemirror/lang-sql`  | ~50KB             | SQL syntax highlighting |
| R CodeMirror mode (TBD) | ~10KB             | R syntax highlighting   |

---

## Verification Checklist

- [ ] `bun run typecheck` passes with new `RuntimeLanguage` values
- [ ] `bun run lint` passes
- [ ] SQL: Open cs50sql preset, run `CREATE TABLE t(x); INSERT INTO t VALUES(1); SELECT * FROM t;` — verify ASCII table output
- [ ] SQL: Verify seed.sql auto-execution on environment init
- [ ] SQL: Verify multi-statement splitting handles semicolons inside string literals
- [ ] R: Open cs50r preset, run `x <- 1:10; print(x)` — verify output in terminal
- [ ] R: Run `plot(1:10)` — verify SVG appears in HTML preview pane
- [ ] Terminal: Type `sqlite3` and `Rscript` — verify command routing
- [ ] Editor: Verify syntax highlighting for `.sql` and `.R` files
- [ ] webR: Verify lazy-loading only triggers on first R use, not on workspace mount
