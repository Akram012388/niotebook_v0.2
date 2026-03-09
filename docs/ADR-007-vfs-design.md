# ADR Status: ACCEPTED

## Title

Virtual FileSystem — In-Memory Tree with IndexedDB Persistence

## Context

Niotebook needs multi-file editing with tabs, a file tree sidebar, and per-language starter files. Several constraints shaped the design:

- Files must survive page reloads without a server round-trip on every keystroke.
- Each lesson has its own isolated set of files — changes to one lesson must not bleed into another.
- The code editor requires synchronous reads so it never blocks on I/O.
- Convex is the server-side data store, but its schema covers courses, transcripts, chat, and analytics — not user file content.

## Decision

Three collaborating pieces form the VFS:

**`VirtualFS` class (`src/infra/vfs/VirtualFS.ts`)** — An in-memory tree whose nodes are `VFSFile` or `VFSDirectory` objects stored in nested `Map` structures. All reads (`readFile`, `readDir`, `stat`, `glob`) are synchronous. Writes (`writeFile`, `mkdir`, `rename`, `delete`) mutate the tree and emit typed `VFSEvent` objects to registered listeners. Size limits are enforced at write time: 1 MB per file, 50 MB total. The class also exposes `snapshot()` / `restore()` for serialization, converting the internal `Map`-based tree to plain arrays for JSON compatibility.

**`useFileSystemStore` Zustand store (`src/infra/vfs/useFileSystemStore.ts`)** — Wraps a `VirtualFS` instance and re-derives a flat `files[]` + `directories[]` array after every mutation so React components receive standard referential updates. Every write action calls `scheduleAutoPersist()`, which debounces IndexedDB writes at 500 ms using a module-level timer. The active lesson ID is tracked in a module-level variable (`currentLessonId`) set during `loadFromIndexedDB`. `initializeFromEnvironment` consumes a `LessonEnvironment` domain type to populate per-language starter files on first load.

**`indexedDbBackend` (`src/infra/vfs/indexedDbBackend.ts`)** — Thin wrapper around the `idb` library. Opens a single database (`niotebook-vfs`, `DB_VERSION = 1`) with one object store (`projects`). Keys are lesson IDs; values are JSON-serialized `VFSSnapshotNode` strings. Write failures log `console.warn` and resolve silently; read failures return `null` so the store falls through to seeding starter files. IndexedDB errors never crash the editor.

**No server-side VFS** — The Convex schema has no table for file trees. Files are browser-local only. `codeSnapshots` in Convex stores a single active code string + hash per lesson per language for AI context, but that is separate from the full multi-file VFS.

**Startup sequence** — On workspace mount the store calls `loadFromIndexedDB(lessonId)`. If a snapshot exists it is restored; otherwise `initializeFromEnvironment` seeds the starter files from the lesson's `environmentConfig`. The `isLoaded` flag gates the editor render to prevent a flash of empty state.

## Consequences

**Positive**

- Zero server latency for file reads — the editor opens instantly.
- Works fully offline once the page has loaded.
- Simple, auditable implementation — the entire VFS is ~415 lines of TypeScript with no external runtime dependencies.
- Lesson isolation is enforced by key: one IndexedDB entry per lesson ID.

**Negative / risks**

- Browser storage quota limits apply (quota varies by browser and available disk; browsers may evict data under storage pressure).
- No server sync means files are lost if the user clears IndexedDB, switches browsers, or moves to another device.
- No cross-device or cross-user sharing — multi-player collaboration is not possible with this design.
- Cold-start requires an async IndexedDB read before files are available. If that read is slow the editor shows a loading state.
- `DB_VERSION = 1` has no migration path yet. A schema change (e.g. adding metadata fields) requires a manual upgrade handler or data loss.

## Future

- Add a `DB_VERSION` upgrade handler in `indexedDbBackend.ts` before any schema changes land.
- Consider server-side sync (Convex mutation on explicit save) for cross-device persistence.
- A background sync mechanism could push snapshots to a remote store for offline-first or cross-device collaboration.

## Related Docs

- `src/infra/vfs/VirtualFS.ts`
- `src/infra/vfs/useFileSystemStore.ts`
- `src/infra/vfs/indexedDbBackend.ts`
- `src/domain/lessonEnvironment.ts`
- `convex/schema.ts`
- `docs/ADR-006-architecture-layers.md`
