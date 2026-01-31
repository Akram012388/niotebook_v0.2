/**
 * Lesson Environment — pure types and validation.
 *
 * Defines the shape of per-lesson environment configurations that control
 * which language(s) are available, starter files, packages, and runtime settings.
 */
import type { RuntimeLanguage } from "../infra/runtime/types";

// ── Preset identifiers ────────────────────────────────────────

type EnvPresetId =
  | "cs50x-c"
  | "cs50x-python"
  | "cs50p-python"
  | "cs50w-js"
  | "cs50w-html"
  | "cs50ai-python"
  | "cs50sql-sql"
  | "sandbox";

// ── Starter file ──────────────────────────────────────────────

type StarterFile = {
  path: string;
  content: string;
  readonly: boolean;
};

// ── Package config ────────────────────────────────────────────

type PackageConfig = {
  language: RuntimeLanguage;
  name: string;
  version?: string;
};

// ── Runtime settings ──────────────────────────────────────────

type RuntimeSettings = {
  timeoutMs: number;
  maxOutputBytes: number;
  stdinEnabled: boolean;
  compilerFlags?: string[];
};

// ── Lesson environment ────────────────────────────────────────

type LessonEnvironment = {
  id: string;
  name: string;
  primaryLanguage: RuntimeLanguage;
  allowedLanguages: RuntimeLanguage[];
  starterFiles: StarterFile[];
  packages: PackageConfig[];
  runtimeSettings: RuntimeSettings;
};

// ── Validation ────────────────────────────────────────────────

const VALID_PRESET_IDS: ReadonlySet<string> = new Set<EnvPresetId>([
  "cs50x-c",
  "cs50x-python",
  "cs50p-python",
  "cs50w-js",
  "cs50w-html",
  "cs50ai-python",
  "cs50sql-sql",
  "sandbox",
]);

function isValidPresetId(id: string): id is EnvPresetId {
  return VALID_PRESET_IDS.has(id);
}

function validateLessonEnvironment(env: LessonEnvironment): string[] {
  const errors: string[] = [];

  if (!env.id) errors.push("id is required");
  if (!env.name) errors.push("name is required");
  if (!env.primaryLanguage) errors.push("primaryLanguage is required");

  if (!env.allowedLanguages.includes(env.primaryLanguage)) {
    errors.push("primaryLanguage must be included in allowedLanguages");
  }

  if (env.starterFiles.length === 0) {
    errors.push("at least one starter file is required");
  }

  for (const file of env.starterFiles) {
    if (!file.path) errors.push("starter file path is required");
    if (typeof file.content !== "string") {
      errors.push(`starter file ${file.path}: content must be a string`);
    }
  }

  if (env.runtimeSettings.timeoutMs <= 0) {
    errors.push("timeoutMs must be positive");
  }
  if (env.runtimeSettings.maxOutputBytes <= 0) {
    errors.push("maxOutputBytes must be positive");
  }

  return errors;
}

export { isValidPresetId, validateLessonEnvironment, VALID_PRESET_IDS };
export type {
  EnvPresetId,
  LessonEnvironment,
  PackageConfig,
  RuntimeSettings,
  StarterFile,
};
