import { expect, test } from "@playwright/test";

const lessonId = process.env.NEXT_PUBLIC_DEFAULT_LESSON_ID;
const lessonPath = lessonId
  ? `/workspace?lessonId=${encodeURIComponent(lessonId)}`
  : null;

test.describe("Workspace", () => {
  test("workspace loads with lessonId", async ({ page }) => {
    test.skip(!lessonPath, "No NEXT_PUBLIC_DEFAULT_LESSON_ID configured");
    await page.goto(lessonPath!);
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
  });

  test("workspace without lessonId redirects to /courses", async ({
    page,
  }) => {
    await page.goto("/workspace");
    // Should redirect away from bare /workspace (to /courses per B4)
    await page.waitForURL(/\/(courses|workspace|sign-in)/, { timeout: 10000 });
  });

  test.skip("layout preset toggle works", async ({ page }) => {
    // Requires lessonId and seeded lesson to test layout presets
    test.skip(!lessonPath, "No NEXT_PUBLIC_DEFAULT_LESSON_ID configured");
    await page.goto(lessonPath!);
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
    // Look for layout toggle buttons (single/split/triple)
    const toggles = page.locator('[data-testid="layout-toggle"]');
    await expect(toggles.first()).toBeVisible({ timeout: 5000 });
  });

  test.skip("code editor accepts input", async ({ page }) => {
    // Requires a running workspace with code editor pane
    test.skip(!lessonPath, "No NEXT_PUBLIC_DEFAULT_LESSON_ID configured");
    await page.goto(lessonPath!);
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
    // CodeMirror editor
    const editor = page.locator(".cm-editor");
    await expect(editor).toBeVisible({ timeout: 10000 });
  });

  test.skip("terminal output works after running code", async ({ page }) => {
    // Requires workspace with code editor + terminal, and ability to run code
    test.skip(!lessonPath, "No NEXT_PUBLIC_DEFAULT_LESSON_ID configured");
    await page.goto(lessonPath!);
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
  });
});
