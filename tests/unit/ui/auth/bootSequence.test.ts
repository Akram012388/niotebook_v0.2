// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { cleanup, render, act } from "@testing-library/react";
import { BootSequence } from "../../../../src/ui/auth/BootSequence";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("BootSequence", () => {
  it("renders initial character from first boot line", () => {
    const { container } = render(createElement(BootSequence));
    const text = container.textContent ?? "";
    // Initial state shows first character ">" plus cursor "_"
    expect(text).toContain(">");
  });

  it("renders a blinking cursor", () => {
    const { container } = render(createElement(BootSequence));
    const cursor = container.querySelector(".animate-pulse");
    expect(cursor).not.toBeNull();
    expect(cursor?.textContent).toBe("_");
  });

  it("renders within a mono-font container", () => {
    const { container } = render(createElement(BootSequence));
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("font-mono");
  });

  it("types out characters over time", async () => {
    vi.useFakeTimers();
    const { container } = render(createElement(BootSequence));

    // Advance enough for several characters (30ms each)
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        vi.advanceTimersByTime(30);
      });
    }

    const text = container.textContent ?? "";
    // Should have typed more than just ">" by now
    expect(text.length).toBeGreaterThan(2);
  });
});
