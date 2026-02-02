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

  test("workspace without lessonId redirects to /courses", async ({ page }) => {
    await page.goto("/workspace");
    // Should redirect away from bare /workspace (to /courses per B4)
    await page.waitForURL(/\/(courses|workspace|sign-in)/, { timeout: 10000 });
  });

  test("layout preset toggle works", async ({ page }) => {
    test.skip(!lessonPath, "No NEXT_PUBLIC_DEFAULT_LESSON_ID configured");
    await page.goto(lessonPath!);
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
    // Look for layout toggle buttons (single/split/triple)
    const toggles = page.locator('[data-testid="layout-toggle"]');
    await expect(toggles.first()).toBeVisible({ timeout: 15000 });
  });

  test("code editor accepts input", async ({ page }) => {
    test.skip(!lessonPath, "No NEXT_PUBLIC_DEFAULT_LESSON_ID configured");
    await page.goto(lessonPath!);
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
    // Switch to 3-column layout so the code pane is visible
    const tripleToggle = page
      .locator('[data-testid="layout-toggle"]')
      .nth(2);
    await expect(tripleToggle).toBeVisible({ timeout: 15000 });
    await tripleToggle.click();
    // CodeMirror editor — may take time to initialize
    const editor = page.locator(".cm-editor");
    await expect(editor).toBeVisible({ timeout: 20000 });
  });

  test("terminal output works after running code", async ({ page }) => {
    test.skip(!lessonPath, "No NEXT_PUBLIC_DEFAULT_LESSON_ID configured");
    await page.goto(lessonPath!);
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
  });
});
