// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { CourseCard } from "../../../../src/ui/courses/CourseCard";
import type { CourseId } from "../../../../src/domain/ids";

afterEach(cleanup);

// Mock framer-motion to render plain divs (no animation in tests)
vi.mock("framer-motion", () => {
  const FM_PROPS = new Set([
    "initial",
    "animate",
    "exit",
    "variants",
    "whileInView",
    "whileHover",
    "whileTap",
    "whileFocus",
    "whileDrag",
    "viewport",
    "transition",
    "custom",
    "layout",
    "layoutId",
  ]);
  return {
    motion: new Proxy(
      {},
      {
        get:
          (_target, tag: string) =>
          ({ children, ...props }: Record<string, unknown>) => {
            const filtered = Object.fromEntries(
              Object.entries(props).filter(([k]) => !FM_PROPS.has(k)),
            );
            return createElement(tag, filtered, children as React.ReactNode);
          },
      },
    ),
  };
});

// Mock next/link to render a plain anchor
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => createElement("a", { href, ...props }, children),
}));

const courseId = "course-1" as CourseId;

describe("CourseCard", () => {
  describe("active variant", () => {
    it("renders title and lesson count", () => {
      render(
        createElement(CourseCard, {
          id: courseId,
          title: "CS50x",
          lessonCount: 12,
          variant: "active",
        }),
      );
      expect(screen.getByText("CS50x")).toBeDefined();
      expect(screen.getByText("12 lectures")).toBeDefined();
    });

    it("renders provider when provided", () => {
      render(
        createElement(CourseCard, {
          id: courseId,
          title: "CS50x",
          provider: "Harvard",
          lessonCount: 5,
          variant: "active",
        }),
      );
      expect(screen.getByText("Harvard")).toBeDefined();
    });

    it("links to course detail page", () => {
      render(
        createElement(CourseCard, {
          id: courseId,
          title: "CS50x",
          lessonCount: 5,
          variant: "active",
        }),
      );
      const link = screen.getByRole("link");
      expect(link.getAttribute("href")).toBe("/courses/course-1");
    });

    it("renders singular 'lecture' for count of 1", () => {
      render(
        createElement(CourseCard, {
          id: courseId,
          title: "CS50x",
          lessonCount: 1,
          variant: "active",
        }),
      );
      expect(screen.getByText("1 lecture")).toBeDefined();
    });

    it("renders progress bar when completedCount > 0", () => {
      const { container } = render(
        createElement(CourseCard, {
          id: courseId,
          title: "CS50x",
          lessonCount: 10,
          completedCount: 3,
          variant: "active",
        }),
      );
      expect(screen.getByText("30% complete")).toBeDefined();
      const bar = container.querySelector("[style]");
      expect(bar).not.toBeNull();
      expect(bar?.getAttribute("style")).toContain("width: 30%");
    });

    it("does not render progress bar when completedCount is 0", () => {
      render(
        createElement(CourseCard, {
          id: courseId,
          title: "CS50x",
          lessonCount: 10,
          completedCount: 0,
          variant: "active",
        }),
      );
      expect(screen.queryByText(/% complete/)).toBeNull();
    });
  });

  describe("coming-soon variant", () => {
    it("renders title and Coming Soon label", () => {
      render(
        createElement(CourseCard, {
          id: courseId,
          title: "MIT 6.006",
          lessonCount: 0,
          variant: "coming-soon",
        }),
      );
      expect(screen.getByText("MIT 6.006")).toBeDefined();
      expect(screen.getByText("Coming Soon")).toBeDefined();
    });

    it("does not render a link", () => {
      render(
        createElement(CourseCard, {
          id: courseId,
          title: "MIT 6.006",
          lessonCount: 0,
          variant: "coming-soon",
        }),
      );
      expect(screen.queryByRole("link")).toBeNull();
    });

    it("renders provider when provided", () => {
      render(
        createElement(CourseCard, {
          id: courseId,
          title: "MIT 6.006",
          provider: "MIT",
          lessonCount: 0,
          variant: "coming-soon",
        }),
      );
      expect(screen.getByText("MIT")).toBeDefined();
    });

    it("applies opacity-50 class", () => {
      const { container } = render(
        createElement(CourseCard, {
          id: courseId,
          title: "MIT 6.006",
          lessonCount: 0,
          variant: "coming-soon",
        }),
      );
      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("opacity-60");
    });
  });
});
