import { describe, expect, it } from "vitest";

describe("smoke", (): void => {
  it("runs a basic assertion", (): void => {
    expect(1 + 1).toBe(2);
  });
});
