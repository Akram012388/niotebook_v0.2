/**
 * VFS ↔ Sandbox serialization layer.
 *
 * Converts VirtualFS state to/from SerializedFile[] for postMessage transfer.
 * When using Wasmer, the sandbox side mounts these into the WASI filesystem.
 * When using the fallback path, the sandbox uses them directly in memory.
 */
import type { VirtualFS } from "../../vfs/VirtualFS";
import type { SerializedFile } from "./wasmerTypes";

/**
 * Serialize all files from VFS into a flat array suitable for postMessage.
 * Only includes files (not directories) — the sandbox recreates directories as needed.
 */
function serializeVFS(vfs: VirtualFS): SerializedFile[] {
  const allFiles = vfs.glob("**/*");
  return allFiles.map((file) => ({
    path: file.path,
    content: file.content,
  }));
}

/**
 * Apply file changes from the sandbox back into VFS.
 * Called when the sandbox reports fs-write events after execution.
 */
function applyToVFS(
  vfs: VirtualFS,
  files: ReadonlyArray<SerializedFile>,
): void {
  for (const file of files) {
    vfs.writeFile(file.path, file.content);
  }
}

export { serializeVFS, applyToVFS };
