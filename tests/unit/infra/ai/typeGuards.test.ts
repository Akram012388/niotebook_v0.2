import { describe, expect, it } from "vitest";

import { isNumber, isRecord, isString } from "@/infra/ai/typeGuards";

// ---------------------------------------------------------------------------
// isRecord
// ---------------------------------------------------------------------------

describe("isRecord", () => {
  it("plain empty object → true", () => {
    expect(isRecord({})).toBe(true);
  });

  it("object with keys → true", () => {
    expect(isRecord({ foo: "bar", count: 42 })).toBe(true);
  });

  it("null → false", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("array → false", () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord([1, 2, 3])).toBe(false);
  });

  it("string → false", () => {
    expect(isRecord("hello")).toBe(false);
  });

  it("number → false", () => {
    expect(isRecord(42)).toBe(false);
  });

  it("undefined → false", () => {
    expect(isRecord(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isString
// ---------------------------------------------------------------------------

describe("isString", () => {
  it('"hello" → true', () => {
    expect(isString("hello")).toBe(true);
  });

  it("empty string → true", () => {
    expect(isString("")).toBe(true);
  });

  it("0 → false", () => {
    expect(isString(0)).toBe(false);
  });

  it("null → false", () => {
    expect(isString(null)).toBe(false);
  });

  it("undefined → false", () => {
    expect(isString(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isNumber
// ---------------------------------------------------------------------------

describe("isNumber", () => {
  it("42 → true", () => {
    expect(isNumber(42)).toBe(true);
  });

  it("0 → true", () => {
    expect(isNumber(0)).toBe(true);
  });

  it("-1.5 → true", () => {
    expect(isNumber(-1.5)).toBe(true);
  });

  it("NaN → false (excluded)", () => {
    expect(isNumber(NaN)).toBe(false);
  });

  it("Infinity → false (excluded via Number.isFinite)", () => {
    expect(isNumber(Infinity)).toBe(false);
    expect(isNumber(-Infinity)).toBe(false);
  });

  it('"42" → false', () => {
    expect(isNumber("42")).toBe(false);
  });

  it("null → false", () => {
    expect(isNumber(null)).toBe(false);
  });
});
