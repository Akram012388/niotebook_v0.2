#!/usr/bin/env bun
/**
 * Checks for forbidden word patterns in specified directories.
 * Usage: bun run scripts/check-forbidden.ts <pattern> <dir1> [dir2...]
 *
 * Skips generated files (paths containing "_generated") and comment lines.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const [, , pattern, ...dirs] = process.argv;
if (!pattern || dirs.length === 0) {
  console.error("Usage: check-forbidden.ts <word-pattern> <dir1> [dir2...]");
  process.exit(1);
}

const regex = new RegExp(`\\b${pattern}\\b`);
const matches: string[] = [];

function walkTs(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkTs(full));
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

for (const dir of dirs) {
  for (const fullPath of walkTs(dir)) {
    if (fullPath.includes("_generated")) continue;
    const content = readFileSync(fullPath, "utf8");
    const lines = content.split("\n");
    let inBlockComment = false;
    lines.forEach((line: string, i: number) => {
      const trimmed = line.trim();
      // Track block comment boundaries
      if (inBlockComment) {
        if (trimmed.includes("*/")) inBlockComment = false;
        return;
      }
      if (trimmed.includes("/*")) {
        if (!trimmed.includes("*/")) inBlockComment = true;
        return;
      }
      // Skip single-line comment lines and JSDoc/block comment lines
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
      if (regex.test(line)) {
        matches.push(`${fullPath}:${i + 1}: ${trimmed}`);
      }
    });
  }
}

if (matches.length > 0) {
  console.error(`error: '${pattern}' is forbidden in these locations:`);
  matches.forEach((m) => console.error(` ${m}`));
  process.exit(1);
}
