import { describe, it, expect } from "vitest";
import {
  isValidPresetId,
  validateLessonEnvironment,
  VALID_PRESET_IDS,
} from "../../../src/domain/lessonEnvironment";
import { ENV_PRESETS } from "../../../src/infra/runtime/envPresets";
import type { EnvPresetId } from "../../../src/domain/lessonEnvironment";

describe("lessonEnvironment", () => {
  describe("VALID_PRESET_IDS", () => {
    it("includes all expected preset IDs", () => {
      const expected = [
        "cs50x-c",
        "cs50x-python",
        "cs50p-python",
        "cs50w-js",
        "cs50w-html",
        "cs50ai-python",
        "sandbox",
      ];
      for (const id of expected) {
        expect(VALID_PRESET_IDS.has(id)).toBe(true);
      }
    });

    it("has exactly 9 presets", () => {
      expect(VALID_PRESET_IDS.size).toBe(9);
    });
  });

  describe("isValidPresetId", () => {
    it("returns true for all valid preset IDs", () => {
      for (const id of VALID_PRESET_IDS) {
        expect(isValidPresetId(id)).toBe(true);
      }
    });

    it("returns false for invalid IDs", () => {
      expect(isValidPresetId("invalid")).toBe(false);
      expect(isValidPresetId("")).toBe(false);
      expect(isValidPresetId("cs50x")).toBe(false);
    });
  });

  describe("ENV_PRESETS", () => {
    const presetIds = Object.keys(ENV_PRESETS) as EnvPresetId[];

    it("has a preset for every valid ID", () => {
      for (const id of VALID_PRESET_IDS) {
        expect(ENV_PRESETS[id as EnvPresetId]).toBeDefined();
      }
    });

    it.each(presetIds)("preset '%s' passes validation", (id) => {
      const env = ENV_PRESETS[id];
      const errors = validateLessonEnvironment(env);
      expect(errors).toEqual([]);
    });

    it.each(presetIds)("preset '%s' has matching id field", (id) => {
      expect(ENV_PRESETS[id].id).toBe(id);
    });

    it.each(presetIds)(
      "preset '%s' includes primaryLanguage in allowedLanguages",
      (id) => {
        const env = ENV_PRESETS[id];
        expect(env.allowedLanguages).toContain(env.primaryLanguage);
      },
    );

    it("cs50x-python preset is configured correctly", () => {
      const env = ENV_PRESETS["cs50x-python"];
      expect(env.primaryLanguage).toBe("python");
      expect(env.starterFiles.length).toBeGreaterThan(0);
      expect(env.runtimeSettings.timeoutMs).toBeGreaterThan(0);
    });
  });

  describe("validateLessonEnvironment", () => {
    it("returns errors for invalid environment", () => {
      const errors = validateLessonEnvironment({
        id: "",
        name: "",
        primaryLanguage: "js",
        allowedLanguages: ["python"],
        starterFiles: [],
        packages: [],
        runtimeSettings: {
          timeoutMs: 0,
          maxOutputBytes: 0,
          stdinEnabled: false,
        },
      });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain("id is required");
      expect(errors).toContain("name is required");
    });
  });
});
