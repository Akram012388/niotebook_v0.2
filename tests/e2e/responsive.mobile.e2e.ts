import { test, expect } from "@playwright/test";

test.describe("responsive layout", () => {
  test("mobile gate is shown on narrow viewport @mobile", async ({
    page,
    viewport,
  }) => {
    // Skip if somehow run on a desktop viewport (>= lg breakpoint 1024px)
    test.skip(viewport!.width >= 1024, "desktop viewport");
    // /courses uses MobileGate and is accessible without a lesson ID
    await page.goto("/courses");
    // MobileGate renders a full-screen message below the lg breakpoint (1024px)
    await expect(
      page.getByText("niotebook is best experienced on desktop"),
    ).toBeVisible();
  });

  test("workspace loads on desktop viewport", async ({ page, viewport }) => {
    test.skip(viewport!.width < 1024, "mobile viewport");
    await page.goto("/");
    await expect(page).toHaveTitle(/Niotebook/i);
  });
});
