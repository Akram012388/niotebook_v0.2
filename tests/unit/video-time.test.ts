import { describe, expect, it } from "vitest";
import { clampVideoTime, shouldPersistVideoTime } from "../../src/domain/video";

describe("video time helpers", (): void => {
  it("clamps non-finite and negative values", (): void => {
    expect(clampVideoTime(-5)).toBe(0);
    expect(clampVideoTime(Number.NaN)).toBe(0);
  });

  it("clamps to integer seconds", (): void => {
    expect(clampVideoTime(12.7)).toBe(12);
  });

  it("persists only when interval exceeded", (): void => {
    expect(
      shouldPersistVideoTime({
        currentSec: 10,
        lastSampleSec: 8,
        intervalSec: 3,
      }),
    ).toBe(false);
    expect(
      shouldPersistVideoTime({
        currentSec: 12,
        lastSampleSec: 8,
        intervalSec: 3,
      }),
    ).toBe(true);
  });
});
