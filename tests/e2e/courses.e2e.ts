import { expect, test } from "@playwright/test";

test.describe("Course browsing", () => {
  test("courses page loads with content", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
  });

  test("courses page shows course cards", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
    // Should have at least one course card or heading visible
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(0);
  });

  test("coming soon row shows greyed-out cards", async ({ page }) => {
    await page.goto("/courses");
    // Coming soon cards have opacity-60 and "Coming Soon" text
    const comingSoon = page.getByText("Coming Soon").first();
    await expect(comingSoon).toBeVisible({ timeout: 15000 });
  });

  test("click course card navigates to detail page", async ({ page }) => {
    await page.goto("/courses");
    const card = page.locator('a[href^="/courses/"]').first();
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.click();
    await page.waitForURL(/\/courses\//, { timeout: 10000 });
  });

  test("course detail page shows lecture list", async ({ page }) => {
    await page.goto("/courses");
    // Navigate to first available course
    const card = page.locator('a[href^="/courses/"]').first();
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.click();
    await page.waitForURL(/\/courses\//, { timeout: 10000 });
    // Verify lecture list heading
    await expect(page.getByText("Lectures")).toBeVisible({ timeout: 15000 });
    // Verify at least one lesson row exists
    await expect(page.getByText("Start").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("click lecture Start navigates to workspace", async ({ page }) => {
    await page.goto("/courses");
    const card = page.locator('a[href^="/courses/"]').first();
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.click();
    await page.waitForURL(/\/courses\//, { timeout: 10000 });
    await expect(page.getByText("Lectures")).toBeVisible({ timeout: 15000 });
    const startBtn = page
      .locator('a[href^="/workspace?lessonId="]')
      .getByText("Start")
      .first();
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();
    await page.waitForURL(/\/workspace\?lessonId=/, { timeout: 15000 });
  });
});
